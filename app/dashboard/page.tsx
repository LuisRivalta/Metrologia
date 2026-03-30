import { ManagementShell, PlaceholderSection } from "../_components/management-shell";

export default function DashboardPage() {
  return (
    <ManagementShell activeItem="dashboard">
      <PlaceholderSection
        title="Dashboard"
        description="Página padrão criada. Podemos montar os indicadores e cards daqui na próxima etapa."
      />
    </ManagementShell>
  );
}
