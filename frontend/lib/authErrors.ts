/**
 * Map Convex Auth error messages to user-friendly text.
 */
export function getAuthErrorMessage(message: string): string {
  if (message.includes("InvalidSecret") || message.includes("InvalidAccountId")) {
    return "Invalid email or password.";
  }
  if (message.includes("TooManyFailedAttempts")) {
    return "Too many failed attempts. Please try again later.";
  }
  return message;
}

export function getAuthErrorHint(message: string): string | null {
  if (message.includes("InvalidSecret") || message.includes("InvalidAccountId")) {
    return "Use the password you set when you signed up on this app. If you signed up on a different environment (e.g. dev), create an account here first.";
  }
  if (message.includes("Server Error")) {
    return "Check your Convex production deployment: set JWT_PRIVATE_KEY and JWKS in Environment variables (Dashboard → Settings).";
  }
  return null;
}
