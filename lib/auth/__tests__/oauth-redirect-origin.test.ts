import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  getConfiguredSiteOrigin,
  getGoogleOAuthRedirectUrls,
  getOAuthRedirectOrigin,
} from "../oauth-redirect-origin";

describe("oauth-redirect-origin", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("getConfiguredSiteOrigin parses NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://theopenstock.com/";
    expect(getConfiguredSiteOrigin()).toBe("https://theopenstock.com");
  });

  it("getOAuthRedirectOrigin prefers configured site over request host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://theopenstock.com";
    const request = new NextRequest("https://www.theopenstock.com/api/auth/oauth/google");
    expect(getOAuthRedirectOrigin(request)).toBe("https://theopenstock.com");
  });

  it("getOAuthRedirectOrigin falls back to request when unset", () => {
    const request = new NextRequest("http://localhost:3000/api/auth/oauth/google");
    expect(getOAuthRedirectOrigin(request)).toBe("http://localhost:3000");
  });

  it("getOAuthRedirectOrigin ignores NEXT_PUBLIC_SITE_URL on localhost", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://theopenstock.com";
    const request = new NextRequest("http://localhost:3000/api/auth/oauth/google");
    expect(getOAuthRedirectOrigin(request)).toBe("http://localhost:3000");
  });

  it("getGoogleOAuthRedirectUrls builds callback paths", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://theopenstock.com";
    const request = new NextRequest("https://www.theopenstock.com/api/auth/oauth/google");
    const callback = "https://theopenstock.com/api/auth/callback/google";
    expect(getGoogleOAuthRedirectUrls(request)).toEqual({
      origin: "https://theopenstock.com",
      success: callback,
      failure: callback,
    });
  });
});
