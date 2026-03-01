import { GlobalStreamDashboard } from "@/components/GlobalStreamDashboard";
import { ClearLoginRedirectFlag } from "@/components/ClearLoginRedirectFlag";
import { PageLoadingFallback } from "@/components/PageLoadingFallback";
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <>
      <ClearLoginRedirectFlag />
      <Suspense fallback={<PageLoadingFallback label="Loading dashboard…" />}>
        <GlobalStreamDashboard />
      </Suspense>
    </>
  );
}
