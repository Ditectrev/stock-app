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
  appleSignInFailed: "We couldn't start Apple sign-in. Try again.",
  googleSignInFailed: "We couldn't start Google sign-in. Try again.",
  verificationEmailFailed:
    "We couldn't send the verification email. Check the address and try again.",
  oauthSessionFailed: "We couldn't finish sign-in. Try again.",
  emailOtpVerifyFailed:
    "That code didn't work. It may have expired — request a new one.",
  signOutFailed: "We couldn't sign out. Try again.",
  ollamaTimeout:
    "Local Ollama timed out. Make sure Ollama is running at http://localhost:11434 and the model is available.",
  ollamaReachPrefix:
    "We couldn't reach local Ollama at http://localhost:11434 from the browser",
  hostedRateLimitPrefix: "Rate limit reached. Try again",
  hostedReachPrefix: "We couldn't reach hosted AI",
  hostedTierRequired:
    "Hosted AI requires an active subscription. Upgrade to the Hosted AI tier.",
  trialStartFailed: "We couldn't start your trial. Try again.",
  trialStatusFailed: "We couldn't load trial status. Try again.",
  trialEndFailed: "We couldn't end the trial session. Try again.",
  trialEligibilityFailed: "We couldn't check trial eligibility. Try again.",
} as const;
