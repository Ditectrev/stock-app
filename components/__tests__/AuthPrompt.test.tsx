/**
 * AuthPrompt Component Tests
 * Tests for provider button clicks, email form validation, and error message display.
 * Requirements: 1.6
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthPrompt, AuthPromptProps } from "../AuthPrompt";

const defaultProps: AuthPromptProps = {
  open: true,
  onClose: vi.fn(),
  onEmailSubmit: vi.fn().mockResolvedValue({ ok: false }),
  onEmailVerify: vi.fn().mockResolvedValue({ ok: true }),
};

function renderAuthPrompt(overrides: Partial<AuthPromptProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<AuthPrompt {...props} />);
}

describe("AuthPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("should not render when open is false", () => {
    renderAuthPrompt({ open: false });
    expect(screen.queryByTestId("auth-prompt")).toBeNull();
  });

  it("should render the modal when open is true", () => {
    renderAuthPrompt();
    expect(screen.getByTestId("auth-prompt")).toBeDefined();
    expect(screen.getByText("Sign in to continue")).toBeDefined();
  });

  // --- Provider rendering ---

  it("should show Google sign-in and note that Apple is unavailable", () => {
    renderAuthPrompt();

    expect(screen.getByTestId("auth-google").getAttribute("href")).toBe(
      "/api/auth/oauth/google"
    );
    expect(screen.getByTestId("auth-apple-disabled")).toBeDefined();
    expect(screen.getByTestId("auth-apple-unavailable-note")).toBeDefined();
    expect(screen.queryByTestId("auth-sso-disabled-note")).toBeNull();
  });

  it("should disable provider controls when loading", () => {
    renderAuthPrompt({ loading: true });

    const emailBtn = screen.getByTestId("auth-email-btn") as HTMLButtonElement;
    expect(emailBtn.disabled).toBe(true);
  });

  it("should show loading text when loading is true", () => {
    renderAuthPrompt({ loading: true });
    expect(screen.getByText("Please wait…")).toBeDefined();
  });

  // --- Close button ---

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    renderAuthPrompt({ onClose });

    fireEvent.click(screen.getByTestId("auth-close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should hide close button when modal is not dismissible", () => {
    renderAuthPrompt({ dismissible: false });
    expect(screen.queryByTestId("auth-close")).toBeNull();
  });

  // --- Email form navigation ---

  it("should switch to email view when email button is clicked", () => {
    renderAuthPrompt();

    fireEvent.click(screen.getByTestId("auth-email-btn"));

    expect(screen.getByTestId("auth-email-input")).toBeDefined();
    expect(screen.getByTestId("auth-email-submit")).toBeDefined();
  });

  it("should switch back to providers view when back button is clicked", () => {
    renderAuthPrompt();

    fireEvent.click(screen.getByTestId("auth-email-btn"));
    fireEvent.click(screen.getByTestId("auth-back"));

    expect(screen.getByTestId("auth-google")).toBeDefined();
  });

  // --- Email form validation ---

  it("should show error for empty email submission", () => {
    renderAuthPrompt();

    fireEvent.click(screen.getByTestId("auth-email-btn"));

    // Use fireEvent.submit to bypass native required validation in jsdom
    const form = screen.getByTestId("auth-email-submit").closest("form")!;
    fireEvent.submit(form);

    expect(screen.getByTestId("auth-error")).toBeDefined();
    expect(screen.getByText("Enter your email address.")).toBeDefined();
  });

  it("should show error for invalid email format", () => {
    renderAuthPrompt();

    fireEvent.click(screen.getByTestId("auth-email-btn"));
    fireEvent.change(screen.getByTestId("auth-email-input"), {
      target: { value: "not-an-email" },
    });

    const form = screen.getByTestId("auth-email-submit").closest("form")!;
    fireEvent.submit(form);

    expect(screen.getByText("Enter a valid email address.")).toBeDefined();
  });

  it("should call onEmailSubmit with trimmed email for valid input", () => {
    const onEmailSubmit = vi.fn();
    renderAuthPrompt({ onEmailSubmit });

    fireEvent.click(screen.getByTestId("auth-email-btn"));
    fireEvent.change(screen.getByTestId("auth-email-input"), {
      target: { value: "  user@example.com  " },
    });
    fireEvent.click(screen.getByTestId("auth-email-submit"));

    expect(onEmailSubmit).toHaveBeenCalledWith("user@example.com");
  });

  it("should not call onEmailSubmit for whitespace-only email", () => {
    const onEmailSubmit = vi.fn();
    renderAuthPrompt({ onEmailSubmit });

    fireEvent.click(screen.getByTestId("auth-email-btn"));
    fireEvent.change(screen.getByTestId("auth-email-input"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByTestId("auth-email-submit"));

    expect(onEmailSubmit).not.toHaveBeenCalled();
  });

  it("should clear email validation error when navigating back", () => {
    renderAuthPrompt();

    // Trigger validation error
    fireEvent.click(screen.getByTestId("auth-email-btn"));
    const form = screen.getByTestId("auth-email-submit").closest("form")!;
    fireEvent.submit(form);
    expect(screen.getByTestId("auth-error")).toBeDefined();

    // Go back — error should be cleared
    fireEvent.click(screen.getByTestId("auth-back"));
    expect(screen.queryByTestId("auth-error")).toBeNull();
  });

  // --- External error display (Req 1.6) ---

  it("should display external error message", () => {
    renderAuthPrompt({ error: "Authentication failed. Please try again." });

    const errorEl = screen.getByTestId("auth-error");
    expect(errorEl).toBeDefined();
    expect(errorEl.textContent).toBe(
      "Authentication failed. Please try again."
    );
  });

  it("should have role=alert on error element for accessibility", () => {
    renderAuthPrompt({ error: "Something went wrong" });

    const errorEl = screen.getByTestId("auth-error");
    expect(errorEl.getAttribute("role")).toBe("alert");
  });

  it("should not display error element when no error exists", () => {
    renderAuthPrompt({ error: null });
    expect(screen.queryByTestId("auth-error")).toBeNull();
  });

  // --- Accessibility ---

  it("should have proper dialog role and aria attributes", () => {
    renderAuthPrompt();

    expect(screen.getByTestId("auth-prompt")).toBeDefined();
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Sign in");
  });

  it("should disable email submit button when loading", () => {
    // Render without loading first so we can navigate to email view
    const { rerender } = render(
      <AuthPrompt {...defaultProps} loading={false} />
    );

    fireEvent.click(screen.getByTestId("auth-email-btn"));

    // Now re-render with loading=true
    rerender(<AuthPrompt {...defaultProps} loading={true} />);

    const submitBtn = screen.getByTestId(
      "auth-email-submit"
    ) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.textContent).toBe("Sending…");
  });
});
