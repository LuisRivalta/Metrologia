import { ManagementShell } from "../../_components/management-shell";
import { SettingsContent } from "../../_components/settings-content";

export default function ConfiguracoesMedidasPage() {
  return (
    <ManagementShell activeItem="configuracoes">
      <SettingsContent />
    </ManagementShell>
  );
}
