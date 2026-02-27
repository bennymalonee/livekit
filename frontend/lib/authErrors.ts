/**
 * Map Convex Auth error messages to user-friendly text.
 * Note: Convex often surfaces action errors as "[Request ID: ...] Server Error",
 * so the real error (e.g. InvalidSecret) only appears in Convex logs.
 */
export function getAuthErrorMessage(message: string): string {
  if (message.includes("InvalidSecret") || message.includes("InvalidAccountId")) {
    return "Invalid email or password.";
  }
  if (message.includes("TooManyFailedAttempts")) {
    return "Too many failed attempts. Please try again later.";
  }
  if (message.includes("Server Error") || message.includes("Request ID")) {
    return "Sign-in failed.";
  }
  return message;
}

export function getAuthErrorHint(message: string): string | null {
  if (message.includes("InvalidSecret") || message.includes("InvalidAccountId")) {
    return "Use the password you set when you signed up on this app. If you signed up on a different environment (e.g. dev), create an account here first.";
  }
  // Convex often hides the real error (e.g. InvalidSecret) and sends "Server Error" to the client.
  if (message.includes("Server Error") || message.includes("Request ID")) {
    return "Check Convex logs: if you see InvalidSecret, the password is wrong — use the password you set when you signed up here, or sign up first. Otherwise, set JWT_PRIVATE_KEY and JWKS in Convex Dashboard → Settings.";
  }
  return null;
}
