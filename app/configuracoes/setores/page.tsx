import { ManagementShell } from "../../_components/management-shell";
import { SetoresContent } from "../../_components/setores-content";

export default function ConfiguracoesSetoresPage() {
  return (
    <ManagementShell activeItem="configuracoes">
      <SetoresContent />
    </ManagementShell>
  );
}
