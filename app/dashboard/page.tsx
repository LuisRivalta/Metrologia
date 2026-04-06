import { DashboardContent } from "../_components/dashboard-content";
import { ManagementShell } from "../_components/management-shell";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <ManagementShell activeItem="dashboard">
      <DashboardContent />
    </ManagementShell>
  );
}
