export type SetorRow = {
  id: number;
  codigo: string;
  nome: string;
  created_at?: string | null;
};

export type SetorItem = {
  id: number;
  codigo: string;
  nome: string;
};

export function mapSetorRow(row: SetorRow): SetorItem {
  return {
    id: row.id,
    codigo: row.codigo.trim(),
    nome: row.nome.trim()
  };
}

export function formatSetorLabel(setor: SetorItem): string {
  return `${setor.codigo} – ${setor.nome}`;
}
