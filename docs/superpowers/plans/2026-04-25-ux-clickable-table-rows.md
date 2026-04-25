# UX: Linhas Clicáveis na Lista de Instrumentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar cada linha da tabela de instrumentos clicável em sua totalidade, navegando para `/instrumentos/:id`, com hover visual sutil.

**Architecture:** Adiciona `onClick` no `<tr>` com `router.push`, `stopPropagation` no link da tag e no wrapper das ações, e CSS de hover em `app/globals.css`. Nenhuma mudança em lógica de negócio ou API.

**Tech Stack:** Next.js 14 (Client Component), TypeScript, CSS global (`app/globals.css`)

---

## File Map

| Arquivo | Mudança |
|---|---|
| `app/globals.css` | 3 novas regras CSS: `__row--clickable`, hover light, hover dark |
| `app/_components/instruments-content.tsx` | Import `useRouter`, hook, `onClick` no `<tr>`, `stopPropagation` no tag link e no wrapper de ações |

---

## Task 1: CSS — Estilos de hover para linhas clicáveis

**Files:**
- Modify: `app/globals.css:~1477` (após `.inventory-table__row--loading td`)
- Modify: `app/globals.css:~7520` (após `html[data-theme="dark"] .inventory-table__row--loading td`)

- [ ] **Step 1: Adicionar regras de cursor e hover (light theme)**

Localizar `.inventory-table__row--loading td` (linha ~1477). Adicionar logo após o bloco:

```css
.inventory-table__row--clickable {
  cursor: pointer;
}

.inventory-table__row--clickable:hover td {
  background: rgba(13, 79, 153, 0.04);
}
```

- [ ] **Step 2: Adicionar hover para dark theme**

Localizar `html[data-theme="dark"] .inventory-table__row--loading td` (linha ~7520). Adicionar logo após:

```css
html[data-theme="dark"] .inventory-table__row--clickable:hover td {
  background: rgba(74, 108, 170, 0.07);
}
```

- [ ] **Step 3: Verificar build**

```bash
cd C:/Metrologia && npm run build 2>&1 | tail -5
```

Esperado: build sem erros.

- [ ] **Step 4: Commit**

```bash
cd C:/Metrologia && git add app/globals.css && git commit -m "style: add hover styles for clickable table rows"
```

---

## Task 2: TSX — Tornar linhas da tabela clicáveis

**Files:**
- Modify: `app/_components/instruments-content.tsx:4` (import)
- Modify: `app/_components/instruments-content.tsx:~134` (hook)
- Modify: `app/_components/instruments-content.tsx:~530` (`<tr>`)
- Modify: `app/_components/instruments-content.tsx:~531` (tag pill)
- Modify: `app/_components/instruments-content.tsx:~538` (ações)

- [ ] **Step 1: Adicionar `useRouter` ao import de `next/navigation`**

Localizar linha ~4:

```tsx
/* ANTES */
import { useSearchParams } from "next/navigation";

/* DEPOIS */
import { useRouter, useSearchParams } from "next/navigation";
```

- [ ] **Step 2: Instanciar o router no componente**

Localizar `const searchParams = useSearchParams();` (linha ~134). Adicionar logo após:

```tsx
const router = useRouter();
```

- [ ] **Step 3: Adicionar `onClick` e classe CSS no `<tr>`**

Localizar o `<tr key={row.id}>` dentro do `sortedRows.map` (linha ~530):

```tsx
/* ANTES */
<tr key={row.id}>

/* DEPOIS */
<tr
  key={row.id}
  className="inventory-table__row--clickable"
  onClick={() => router.push(`/instrumentos/${row.id}`)}
>
```

- [ ] **Step 4: Adicionar `stopPropagation` no link da tag**

Localizar o `<PageTransitionLink>` da tag pill (linha ~531):

```tsx
/* ANTES */
<td data-label="Tag"><PageTransitionLink href={`/instrumentos/${row.id}`} className="tag-pill tag-pill--link">{row.tag}</PageTransitionLink></td>

/* DEPOIS */
<td data-label="Tag"><PageTransitionLink href={`/instrumentos/${row.id}`} className="tag-pill tag-pill--link" onClick={e => e.stopPropagation()}>{row.tag}</PageTransitionLink></td>
```

- [ ] **Step 5: Envolver ações em wrapper com `stopPropagation`**

Localizar a `<td data-label="Ações">` (linha ~538). Envolver o conteúdo (botão de editar + PageTransitionLink de calibração) em um `<div onClick={e => e.stopPropagation()}>`:

```tsx
/* ANTES */
<td data-label="Ações">
  <button type="button" className="table-action" aria-label="Editar" onClick={() => openEditModal(row)}>
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z" fill="currentColor" />
      <path d="m13.8 7 3.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  </button>
  <PageTransitionLink
    href={`/instrumentos/${row.id}/calibracoes/nova`}
    className="table-action"
    aria-label="Registrar calibração"
  >
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v6h6M12 11v6M9 14h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </PageTransitionLink>
</td>

/* DEPOIS */
<td data-label="Ações">
  <div onClick={e => e.stopPropagation()}>
    <button type="button" className="table-action" aria-label="Editar" onClick={() => openEditModal(row)}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z" fill="currentColor" />
        <path d="m13.8 7 3.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
    <PageTransitionLink
      href={`/instrumentos/${row.id}/calibracoes/nova`}
      className="table-action"
      aria-label="Registrar calibração"
    >
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 3v6h6M12 11v6M9 14h6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </PageTransitionLink>
  </div>
</td>
```

- [ ] **Step 6: Verificar build**

```bash
cd C:/Metrologia && npm run build 2>&1 | tail -5
```

Esperado: build sem erros TypeScript.

- [ ] **Step 7: Commit**

```bash
cd C:/Metrologia && git add app/_components/instruments-content.tsx && git commit -m "feat: make instrument table rows clickable"
```

---

## Task 3: Verificação final e docs

- [ ] **Step 1: Rodar testes**

```bash
cd C:/Metrologia && npm run test 2>&1 | tail -8
```

Esperado: 85 testes passando, 0 falhas.

- [ ] **Step 2: Subir dev server e testar manualmente**

```bash
cd C:/Metrologia && npm run dev
```

Checklist (http://localhost:3000/instrumentos):

- [ ] Clicar em qualquer célula da linha (Categoria, Fabricante, Setor, Prazo) navega para `/instrumentos/:id`
- [ ] Clicar na tag pill também navega para `/instrumentos/:id` (sem dupla navegação)
- [ ] Clicar no lápis abre o modal de edição (não navega)
- [ ] Clicar no ícone de prancheta navega para `/instrumentos/:id/calibracoes/nova` (não para detalhe)
- [ ] Hover exibe fundo sutil em light theme
- [ ] Hover exibe fundo sutil em dark theme
- [ ] Em mobile: tap na linha navega corretamente

- [ ] **Step 3: Atualizar HANDOFF e LOGS**

Em `docs/estado/LOGS.md`, adicionar entrada:

```
## 2026-04-25 — UX: Linhas Clicáveis na Lista de Instrumentos

Linhas da tabela de instrumentos tornadas clicáveis em sua totalidade via onClick no <tr> + router.push.
stopPropagation no link da tag e no wrapper das ações preserva comportamento existente.
CSS: cursor pointer + hover sutil light/dark.
```

Em `docs/estado/HANDOFF_IA.md`, atualizar "Última sessão" para refletir esta feature como concluída.

- [ ] **Step 4: Commit docs**

```bash
cd C:/Metrologia && git add docs/estado/HANDOFF_IA.md docs/estado/LOGS.md && git commit -m "docs: update HANDOFF and LOGS after clickable table rows"
```
