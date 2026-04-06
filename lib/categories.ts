export type CategoryRow = {
  nome: string | null;
  slug: string | null;
};

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function serializeCategorySlug(value: string) {
  return normalizeCategoryName(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mapCategoryRow(row: CategoryRow): CategoryItem {
  const name = normalizeCategoryName(row.nome ?? "");
  const slug = (row.slug ?? "").trim();

  return {
    id: slug,
    name,
    slug
  };
}
