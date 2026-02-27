import { GlobalStreamDashboard } from "@/components/GlobalStreamDashboard";
import { ClearLoginRedirectFlag } from "@/components/ClearLoginRedirectFlag";

export default function Dashboard() {
  return (
    <>
      <ClearLoginRedirectFlag />
      <GlobalStreamDashboard />
    </>
  );
}
