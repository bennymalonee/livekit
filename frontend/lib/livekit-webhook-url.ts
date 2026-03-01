/**
 * Derive the Convex HTTP LiveKit webhook URL from NEXT_PUBLIC_CONVEX_URL.
 * Use this in the Sessions page so users can copy the URL into their LiveKit server config.
 */
export function getLiveKitWebhookUrl(): string | null {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl?.includes(".cloud")) return null;
  const base = convexUrl.replace(".cloud", ".site").replace(/\/$/, "");
  return `${base}/livekit-webhook`;
}
