import { CategoriesContent } from "../_components/categories-content";
import { ManagementShell } from "../_components/management-shell";

export default function CategoriasPage() {
  return (
    <ManagementShell activeItem="categorias">
      <CategoriesContent />
    </ManagementShell>
  );
}
