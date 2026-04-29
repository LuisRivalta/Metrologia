# Filtros Persistentes via URL + Chips Visuais — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Todos os 4 filtros da lista de instrumentos persistem na URL e chips visuais mostram os filtros ativos.

**Architecture:** Extensão pura de `instruments-content.tsx` — nenhum novo arquivo. Leitura dos 4 params no mount, helper `syncFiltersToURL` chamado a cada mudança de filtro, chips derivados dos 4 estados como `useMemo`.

**Tech Stack:** Next.js App Router (`useSearchParams`, `useRouter`), React `useState`/`useMemo`, CSS em `globals.css`.

---

## File Map

| Arquivo | Mudança |
|---------|---------|
| `app/_components/instruments-content.tsx` | Init URL para 3 filtros; `syncFiltersToURL`; handlers; chips JSX |
| `app/globals.css` | 4 classes novas: `.filter-chips`, `.filter-chip`, `.filter-chip button`, `.filter-chips__clear` |

---

### Task 1: Inicializar 3 filtros da URL + helper syncFiltersToURL

**Files:**
- Modify: `app/_components/instruments-content.tsx`

- [ ] **Step 1: Ler os 3 novos params do URL no mount**

No início de `InstrumentsContent`, logo após a linha `const initialStatus = searchParams.get("status");`, adicionar:

```tsx
const initialCategory = searchParams.get("category") ?? "";
const initialManufacturer = searchParams.get("manufacturer") ?? "";
const initialSetor = searchParams.get("setor") ?? "";
```

- [ ] **Step 2: Usar os valores lidos para inicializar os 3 estados**

Substituir as linhas de `useState` dos 3 filtros (atualmente inicializados com `""`):

```tsx
// antes:
const [categoryFilter, setCategoryFilter] = useState("");
const [manufacturerFilter, setManufacturerFilter] = useState("");
const [setorFilter, setSetorFilter] = useState("");

// depois:
const [categoryFilter, setCategoryFilter] = useState(initialCategory);
const [manufacturerFilter, setManufacturerFilter] = useState(initialManufacturer);
const [setorFilter, setSetorFilter] = useState(initialSetor);
```

- [ ] **Step 3: Adicionar o helper syncFiltersToURL**

Adicionar logo após a função `mapInstrumentDetailFieldToFormItem` (antes de `InstrumentsContent`), ou diretamente dentro do componente, após a declaração de `router`:

```tsx
function syncFiltersToURL(filters: {
  calibrationFilter: CalibrationFilter;
  categoryFilter: string;
  manufacturerFilter: string;
  setorFilter: string;
}) {
  const params = new URLSearchParams(searchParams.toString());
  if (filters.calibrationFilter === "all") { params.delete("status"); } else { params.set("status", filters.calibrationFilter); }
  if (filters.categoryFilter === "") { params.delete("category"); } else { params.set("category", filters.categoryFilter); }
  if (filters.manufacturerFilter === "") { params.delete("manufacturer"); } else { params.set("manufacturer", filters.manufacturerFilter); }
  if (filters.setorFilter === "") { params.delete("setor"); } else { params.set("setor", filters.setorFilter); }
  router.replace(`?${params.toString()}`, { scroll: false });
}
```

A função deve ser declarada **dentro do componente** `InstrumentsContent` para acessar `searchParams` e `router` do closure.

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Esperado: build limpo, sem erros TypeScript.

- [ ] **Step 5: Commit**

```bash
git add app/_components/instruments-content.tsx
git commit -m "feat: init category/manufacturer/setor filters from URL"
```

---

### Task 2: Sincronizar URL a cada mudança de filtro

**Files:**
- Modify: `app/_components/instruments-content.tsx`

- [ ] **Step 1: Atualizar handler do filtro de Categoria**

Localizar o `<select>` de categoria no painel de filtros (tem `value={categoryFilter}`). Substituir o `onChange` atual:

```tsx
// antes:
onChange={(event) => setCategoryFilter(event.target.value)}

// depois:
onChange={(event) => {
  const next = event.target.value;
  setCategoryFilter(next);
  syncFiltersToURL({ calibrationFilter, categoryFilter: next, manufacturerFilter, setorFilter });
}}
```

- [ ] **Step 2: Atualizar handler do filtro de Fabricante**

Localizar o `<select>` de fabricante (tem `value={manufacturerFilter}`). Substituir o `onChange`:

```tsx
// antes:
onChange={(event) => setManufacturerFilter(event.target.value)}

// depois:
onChange={(event) => {
  const next = event.target.value;
  setManufacturerFilter(next);
  syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter: next, setorFilter });
}}
```

- [ ] **Step 3: Atualizar handler do filtro de Setor**

Localizar o `<select>` de setor (tem `value={setorFilter}`). Substituir o `onChange`:

```tsx
// antes:
onChange={(event) => setSetorFilter(event.target.value)}

// depois:
onChange={(event) => {
  const next = event.target.value;
  setSetorFilter(next);
  syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter, setorFilter: next });
}}
```

- [ ] **Step 4: Atualizar handler do filtro de Prazo de validade**

Localizar o `<select>` de calibração (tem `value={calibrationFilter}`). Substituir o `onChange`:

```tsx
// antes:
onChange={(event) => setCalibrationFilter(event.target.value as CalibrationFilter)}

// depois:
onChange={(event) => {
  const next = event.target.value as CalibrationFilter;
  setCalibrationFilter(next);
  syncFiltersToURL({ calibrationFilter: next, categoryFilter, manufacturerFilter, setorFilter });
}}
```

- [ ] **Step 5: Atualizar botão "Limpar filtros"**

Localizar o botão com className `inventory-filters-clear`. Substituir o `onClick`:

```tsx
// antes:
onClick={() => { setCategoryFilter(""); setManufacturerFilter(""); setSetorFilter(""); setCalibrationFilter("all"); }}

// depois:
onClick={() => {
  setCategoryFilter("");
  setManufacturerFilter("");
  setSetorFilter("");
  setCalibrationFilter("all");
  syncFiltersToURL({ calibrationFilter: "all", categoryFilter: "", manufacturerFilter: "", setorFilter: "" });
}}
```

- [ ] **Step 6: Verificar build**

```bash
npm run build
```

Esperado: build limpo.

- [ ] **Step 7: Commit**

```bash
git add app/_components/instruments-content.tsx
git commit -m "feat: sync all 4 instrument filters to URL on change"
```

---

### Task 3: Chips visuais de filtros ativos (JSX + CSS)

**Files:**
- Modify: `app/_components/instruments-content.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Adicionar useMemo activeChips**

Adicionar logo após o `useMemo` de `sortedRows`, antes dos `useEffect`s:

```tsx
const activeChips = useMemo(() => {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (calibrationFilter !== "all") {
    const labels: Record<string, string> = { neutral: "Em dia", warning: "Vencendo", danger: "Vencido" };
    chips.push({
      key: "calibration",
      label: labels[calibrationFilter] ?? calibrationFilter,
      onRemove: () => {
        setCalibrationFilter("all");
        syncFiltersToURL({ calibrationFilter: "all", categoryFilter, manufacturerFilter, setorFilter });
      }
    });
  }

  if (categoryFilter) {
    chips.push({
      key: "category",
      label: categoryFilter,
      onRemove: () => {
        setCategoryFilter("");
        syncFiltersToURL({ calibrationFilter, categoryFilter: "", manufacturerFilter, setorFilter });
      }
    });
  }

  if (manufacturerFilter) {
    chips.push({
      key: "manufacturer",
      label: manufacturerFilter,
      onRemove: () => {
        setManufacturerFilter("");
        syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter: "", setorFilter });
      }
    });
  }

  if (setorFilter) {
    const setorItem = setores.find((s) => String(s.id) === setorFilter);
    const label = setorFilter === "none" ? "Sem setor" : (setorItem ? formatSetorLabel(setorItem) : setorFilter);
    chips.push({
      key: "setor",
      label,
      onRemove: () => {
        setSetorFilter("");
        syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter, setorFilter: "" });
      }
    });
  }

  return chips;
}, [calibrationFilter, categoryFilter, manufacturerFilter, setorFilter, setores]);
```

- [ ] **Step 2: Adicionar JSX dos chips no return**

Localizar no `return` o bloco `{isFiltersOpen ? (...) : null}`. Adicionar o bloco de chips **logo após** esse bloco (antes do `{loadError ? ... : null}`):

```tsx
{activeChips.length > 0 ? (
  <div className="filter-chips">
    {activeChips.map((chip) => (
      <span key={chip.key} className="filter-chip">
        {chip.label}
        <button
          type="button"
          onClick={chip.onRemove}
          aria-label={`Remover filtro ${chip.label}`}
        >
          ×
        </button>
      </span>
    ))}
    <button
      type="button"
      className="filter-chips__clear"
      onClick={() => {
        setCategoryFilter("");
        setManufacturerFilter("");
        setSetorFilter("");
        setCalibrationFilter("all");
        syncFiltersToURL({ calibrationFilter: "all", categoryFilter: "", manufacturerFilter: "", setorFilter: "" });
      }}
    >
      Limpar tudo
    </button>
  </div>
) : null}
```

- [ ] **Step 3: Adicionar CSS dos chips em globals.css**

Localizar a seção de estilos dos filtros de inventário (próxima de `.inventory-filters-card`). Adicionar após essa seção:

```css
/* ── Filter chips ────────────────────────────── */
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 12px;
  align-items: center;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  background: rgba(13, 79, 153, 0.08);
  border: 1px solid #93c5fd;
  color: #1d4ed8;
}

.filter-chip button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  opacity: 0.7;
  color: inherit;
  line-height: 1;
  font-size: 1rem;
}

.filter-chip button:hover {
  opacity: 1;
}

.filter-chips__clear {
  background: none;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 0.8rem;
  cursor: pointer;
  color: var(--muted);
}

.filter-chips__clear:hover {
  background: rgba(0, 0, 0, 0.04);
}

html[data-theme="dark"] .filter-chip {
  background: rgba(30, 58, 95, 0.9);
  border-color: #1d4ed8;
  color: #93c5fd;
}

html[data-theme="dark"] .filter-chips__clear {
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
}

html[data-theme="dark"] .filter-chips__clear:hover {
  background: rgba(255, 255, 255, 0.05);
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Esperado: build limpo, sem erros TypeScript.

- [ ] **Step 5: Commit**

```bash
git add app/_components/instruments-content.tsx app/globals.css
git commit -m "feat: add active filter chips with URL sync to instruments list"
```

---

## Self-Review

**Cobertura da spec:**
- [x] URL sync para todos os 4 filtros (status, category, manufacturer, setor)
- [x] Inicialização de estado a partir da URL no mount para os 3 novos filtros
- [x] `router.replace` com `scroll: false` para não rolar a página
- [x] Preserva outros params existentes via `new URLSearchParams(searchParams.toString())`
- [x] Chips abaixo da toolbar, visíveis independente do painel estar aberto
- [x] Cada chip com botão × que remove só aquele filtro
- [x] Botão "Limpar tudo" reseta os 4 filtros e a URL
- [x] Label do chip de setor: lookup na lista `setores` ou `"Sem setor"` para `"none"`
- [x] Labels de calibration: "Em dia" / "Vencendo" / "Vencido"
- [x] CSS dark theme via `html[data-theme="dark"]`
- [x] `searchTerm` e ordenação fora do escopo (não persistem na URL)

**Fora do escopo confirmado:** busca textual, ordenação, paginação.
