# Design: Filtros Persistentes via URL + Chips Visuais

**Feature:** Filtros da lista de instrumentos persistem na URL e chips visuais mostram filtros ativos.

**Data:** 2026-04-25

---

## Contexto

`/instrumentos` tem 4 filtros: Prazo de validade (`status`), Categoria, Fabricante e Setor. Hoje só `status` lê do URL no mount (via `searchParams.get("status")`). Os outros 3 são estado local puro — desaparecem ao navegar para detalhe e voltar. Não há indicador visual de filtros ativos.

---

## Decisões de design

- **Chips:** abaixo da toolbar, sempre visíveis quando há filtro ativo (independente do painel de filtros estar aberto ou fechado)
- **URL scope:** todos os 4 filtros

---

## Arquitetura

Extensão do padrão existente em `instruments-content.tsx`. Nenhum novo arquivo ou hook.

### Inicialização de estado

Leitura dos 4 params do URL no mount, igualando o padrão que já existe para `status`:

```
status     → calibrationFilter  (valida contra VALID_CALIBRATION_FILTER_STATUSES)
category   → categoryFilter     (string, vazio = sem filtro)
manufacturer → manufacturerFilter (string, vazio = sem filtro)
setor      → setorFilter        (string, vazio = sem filtro; "none" = sem setor)
```

### URL sync

Helper local `syncFiltersToURL(filters)` recebe os 4 valores e chama `router.replace` com os params atualizados. Preserva outros params existentes via `new URLSearchParams(searchParams.toString())`.

Regras de serialização:
- `calibrationFilter === "all"` → deletar `status` da URL
- `categoryFilter === ""` → deletar `category`
- `manufacturerFilter === ""` → deletar `manufacturer`
- `setorFilter === ""` → deletar `setor`
- Demais valores → setar param com o valor atual

Cada handler de filtro existente (nos `<select>`) chama `setState` + `syncFiltersToURL`.

### Chips

Array `activeChips` derivado dos 4 estados:

| Filtro | Label no chip | Condição de exibição |
|---|---|---|
| `calibrationFilter` | `"Vencido"`, `"Vencendo"`, `"Em dia"` | ≠ `"all"` |
| `categoryFilter` | valor direto | ≠ `""` |
| `manufacturerFilter` | valor direto | ≠ `""` |
| `setorFilter` | nome do setor (lookup na lista) ou `"Sem setor"` se `"none"` | ≠ `""` |

Cada chip tem um botão `×` que reseta aquele filtro e atualiza a URL.

Botão "Limpar tudo" reseta os 4 estados e limpa os 4 params da URL.

### Posicionamento no JSX

```
<toolbar>         ← busca + botão Filtros + ações
[filter-panel]    ← painel colapsável existente
<filter-chips>    ← NOVO: chips ativos (só renderiza se activeChips.length > 0)
<table>           ← tabela existente
```

---

## CSS

Novas classes em `app/globals.css`:

| Classe | Descrição |
|---|---|
| `.filter-chips` | flex row, wrap, gap 6px, padding-bottom 12px |
| `.filter-chip` | pill azul (`#1e3a5f` / border `#1d4ed8` / text `#93c5fd`), border-radius 12px |
| `.filter-chip button` | botão `×` inline, sem borda, opacity 0.7 → 1 no hover |
| `.filter-chips__clear` | botão ghost com borda sutil, texto muted |

Dark theme: chips já usam paleta dark-first. Light mode recebe variante mais clara (fundo `rgba(13,79,153,0.08)`, borda `#93c5fd`, texto `#1d4ed8`).

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `app/_components/instruments-content.tsx` | Init URL para 3 filtros adicionais; helper `syncFiltersToURL`; handlers atualizados; JSX dos chips |
| `app/globals.css` | 4–5 novas regras CSS (light + dark) |

---

## Fora do escopo

- `searchTerm` (busca textual) — não persiste na URL (ephemeral)
- Parâmetros de ordenação — não persiste na URL
- Paginação — não existe no componente atual
