/**
 * TrialBanner Component Tests
 * Tests for trial banner display, expiration prompt, and authentication flow trigger.
 * Requirements: 21.9, 21.12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { TrialBanner, TrialBannerProps } from "../TrialBanner";

// Mock the trial API service
vi.mock("@/services/trial-api.service", () => ({
  trialApiService: {
    getTrialStatus: vi.fn(),
    startTrial: vi.fn(),
    endTrial: vi.fn(),
  },
}));

const { postEmailOtpSendMock, postEmailOtpVerifyMock } = vi.hoisted(() => ({
  postEmailOtpSendMock: vi.fn(() =>
    Promise.resolve({ ok: true as const, userId: "test_user_id" })
  ),
  postEmailOtpVerifyMock: vi.fn(() => Promise.resolve({ ok: true as const })),
}));

vi.mock("@/lib/auth/trial-auth-navigation", () => ({
  postEmailOtpSend: postEmailOtpSendMock,
  postEmailOtpVerify: postEmailOtpVerifyMock,
}));

import { trialApiService } from "@/services/trial-api.service";

const mockGetTrialStatus = trialApiService.getTrialStatus as ReturnType<
  typeof vi.fn
>;
const mockEndTrial = trialApiService.endTrial as ReturnType<typeof vi.fn>;

async function renderBanner(overrides: Partial<TrialBannerProps> = {}) {
  const props: TrialBannerProps = { ...overrides };
  const view = render(<TrialBanner {...props} />);
  await act(async () => {
    await Promise.resolve();
  });
  return view;
}

describe("TrialBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Active trial display ---

  it("should display trial banner when trial is active", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    expect(screen.getByTestId("trial-banner")).toBeDefined();
    expect(screen.getByText("Trial session")).toBeDefined();
  });

  it("should display the countdown timer when active (Req 21.9)", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 300,
      hasUsedTrial: true,
    });

    await renderBanner();
    expect(screen.getByTestId("trial-timer")).toBeDefined();
    expect(screen.getByTestId("trial-timer-display").textContent).toBe("5:00");
  });

  it("should show sign-in button during active trial", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 900,
      hasUsedTrial: true,
    });

    await renderBanner();
    expect(screen.getByTestId("trial-sign-in-btn")).toBeDefined();
  });

  // --- Trial not active / no trial ---

  it("should not display banner when trial is inactive and not used", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: false,
      remainingSeconds: 0,
      hasUsedTrial: false,
    });

    await renderBanner();
    expect(screen.queryByTestId("trial-banner")).toBeNull();
    expect(screen.queryByTestId("trial-expired-banner")).toBeNull();
  });

  // --- Expiration prompt (Req 21.12) ---

  it("should show expired banner when trial was used and is inactive", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: false,
      remainingSeconds: 0,
      hasUsedTrial: true,
    });

    await renderBanner();
    const banner = screen.getByTestId("trial-expired-banner");
    expect(banner).toBeDefined();
    expect(banner.textContent).toMatch(/Trial expired/);
  });

  it("should show expired banner with sign-in link after timer expires", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 2,
      hasUsedTrial: true,
    });

    await renderBanner();

    // Advance past expiration
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("trial-expired-banner")).toBeDefined();
    expect(screen.getByTestId("trial-expired-sign-in")).toBeDefined();
  });

  it("should call endTrial on the service when timer expires", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 1,
      hasUsedTrial: true,
    });

    await renderBanner();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockEndTrial).toHaveBeenCalled();
  });

  // --- Authentication flow trigger ---

  it("should open auth prompt when sign-in button is clicked during trial", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    fireEvent.click(screen.getByTestId("trial-sign-in-btn"));

    expect(screen.getByTestId("auth-prompt")).toBeDefined();
  });

  it("should open auth prompt when open-auth-prompt event is dispatched", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    expect(screen.queryByTestId("auth-prompt")).toBeNull();

    act(() => {
      window.dispatchEvent(new Event("open-auth-prompt"));
    });

    expect(screen.getByTestId("auth-prompt")).toBeDefined();
  });

  it("should open auth prompt when expired sign-in link is clicked", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: false,
      remainingSeconds: 0,
      hasUsedTrial: true,
    });

    await renderBanner();
    fireEvent.click(screen.getByTestId("trial-expired-sign-in"));

    expect(screen.getByTestId("auth-prompt")).toBeDefined();
  });

  it("should show auth prompt with email provider", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    fireEvent.click(screen.getByTestId("trial-sign-in-btn"));

    expect(screen.getByTestId("auth-google")).toBeDefined();
    expect(screen.getByTestId("auth-email-btn")).toBeDefined();
  });

  it("should close auth prompt when close button is clicked", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    fireEvent.click(screen.getByTestId("trial-sign-in-btn"));
    expect(screen.getByTestId("auth-prompt")).toBeDefined();

    fireEvent.click(screen.getByTestId("auth-close"));
    expect(screen.queryByTestId("auth-prompt")).toBeNull();
  });

  it("should require sign-in after trial expires (no close button)", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: false,
      remainingSeconds: 0,
      hasUsedTrial: true,
    });

    await renderBanner();
    fireEvent.click(screen.getByTestId("trial-expired-sign-in"));
    expect(screen.getByTestId("auth-prompt")).toBeDefined();
    expect(screen.queryByTestId("auth-close")).toBeNull();
  });

  it("should keep expired banner visible when auth prompt auto-opens", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: false,
      remainingSeconds: 0,
      hasUsedTrial: true,
    });

    await renderBanner();
    expect(screen.getByTestId("trial-expired-banner")).toBeDefined();
    expect(screen.getByTestId("auth-prompt")).toBeDefined();
    expect(screen.getByTestId("auth-prompt")).toBeDefined();
    expect(
      screen.getByRole("heading", {
        name: /Trial expired\. Sign in to continue/i,
      })
    ).toBeDefined();
  });

  // --- onAuthenticated callback ---

  it("should show disabled Apple sign-in with availability note", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    fireEvent.click(screen.getByTestId("trial-sign-in-btn"));
    expect(screen.getByTestId("auth-apple-disabled")).toBeDefined();
    expect(screen.queryByTestId("auth-apple")).toBeNull();
  });

  it("should show Google sign-in button", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    fireEvent.click(screen.getByTestId("trial-sign-in-btn"));
    expect(screen.getByTestId("auth-google")).toBeDefined();
  });

  it("should call onAuthenticated after the email verification code is submitted", async () => {
    vi.useRealTimers();
    postEmailOtpSendMock.mockClear();
    postEmailOtpVerifyMock.mockClear();
    postEmailOtpSendMock.mockResolvedValueOnce({
      ok: true,
      userId: "uid_otp_test",
    });
    postEmailOtpVerifyMock.mockResolvedValueOnce({ ok: true });

    const onAuthenticated = vi.fn();
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner({ onAuthenticated });
    fireEvent.click(screen.getByTestId("trial-sign-in-btn"));
    fireEvent.click(screen.getByTestId("auth-email-btn"));
    fireEvent.change(screen.getByTestId("auth-email-input"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByTestId("auth-email-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-otp-input")).toBeDefined();
    });

    fireEvent.change(screen.getByTestId("auth-otp-input"), {
      target: { value: "512646" },
    });
    fireEvent.click(screen.getByTestId("auth-verify-submit"));

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledOnce();
    });
    expect(postEmailOtpSendMock).toHaveBeenCalledWith("user@example.com");
    expect(postEmailOtpVerifyMock).toHaveBeenCalledWith(
      "uid_otp_test",
      "512646"
    );

    vi.useFakeTimers();
  });

  // --- Accessibility ---

  it("should have role=status on active trial banner", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: true,
      remainingSeconds: 600,
      hasUsedTrial: true,
    });

    await renderBanner();
    expect(screen.getByTestId("trial-banner").getAttribute("role")).toBe(
      "status"
    );
  });

  it("should have role=alert on expired banner", async () => {
    mockGetTrialStatus.mockReturnValue({
      isActive: false,
      remainingSeconds: 0,
      hasUsedTrial: true,
    });

    await renderBanner();
    expect(
      screen.getByTestId("trial-expired-banner").getAttribute("role")
    ).toBe("alert");
  });
});
