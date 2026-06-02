/** User-facing copy for sign-in, trial, and account flows. */

export const AUTH_UI_COPY = {
  signInTitle: "Sign in to continue",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter a valid email address.",
  verificationStartFailed: "We couldn't start verification. Try again.",
  verificationFailed: "Verification didn't complete. Try again.",
  invalidCode: "That code is invalid or expired. Request a new one.",
  sessionExpired: "Session expired. Go back and request a new code.",
  codeLength: "Enter the 6-digit code from your email.",
  genericFailed: "Something went wrong. Try again.",
  networkFailed:
    "We couldn't reach the server. Check your connection and try again.",
  resendFailed: "We couldn't resend the code. Try again.",
  emailSentInfo:
    "We sent a verification email. Check your inbox (and spam) for the 6-digit code.",
  invalidEmailBack: "Invalid email. Go back and re-enter it.",
  signInFailed: "Sign-in failed. Try again.",
  checkoutConfirmFailed:
    "We couldn't confirm checkout. Refresh the page or contact support.",
  subscriptionConfirmFailed:
    "We couldn't confirm your subscription. If you were charged, contact support.",
} as const;
