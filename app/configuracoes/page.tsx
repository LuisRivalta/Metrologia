import { ManagementShell } from "../_components/management-shell";
import { SettingsHomeContent } from "../_components/settings-home-content";

export default function ConfiguracoesPage() {
  return (
    <ManagementShell activeItem="configuracoes">
      <SettingsHomeContent />
    </ManagementShell>
  );
}
