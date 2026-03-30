import { ManagementShell, PlaceholderSection } from "../_components/management-shell";

export default function ConfiguracoesPage() {
  return (
    <ManagementShell activeItem="configuracoes">
      <PlaceholderSection
        title="Configurações"
        description="Página padrão criada. Depois podemos adicionar preferências, permissões e parâmetros do sistema."
      />
    </ManagementShell>
  );
}
