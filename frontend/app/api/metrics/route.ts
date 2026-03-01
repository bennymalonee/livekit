import { NextRequest, NextResponse } from "next/server";

const APP_VERSION = process.env.APP_VERSION ?? "0.1.0";

/**
 * GET /api/metrics - Prometheus-format metrics for monitoring.
 * Optional: set DEPLOY_SECRET and send Authorization: Bearer <secret> or X-Deploy-Secret to allow.
 * If DEPLOY_SECRET is not set, endpoint is open (use in private networks or protect at LB).
 */
export async function GET(request: NextRequest) {
  const deploySecret = process.env.DEPLOY_SECRET;
  if (deploySecret) {
    const auth = request.headers.get("authorization");
    const secretHeader = request.headers.get("x-deploy-secret");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : secretHeader;
    if (token !== deploySecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const lines = [
    "# HELP livkit_app_info Application info.",
    "# TYPE livkit_app_info gauge",
    `livkit_app_info{version="${APP_VERSION}"} 1`,
  ];

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
