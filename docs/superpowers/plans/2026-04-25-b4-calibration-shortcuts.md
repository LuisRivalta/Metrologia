# B4: Atalhos de Registro de Calibração — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um atalho "Registrar calibração" nos cards de alerta do dashboard e na coluna "Ações" da lista de instrumentos, navegando diretamente para `/instrumentos/[id]/calibracoes/nova`.

**Architecture:** Dois pontos de entrada: (1) o `<Link>` que envolve cada card de alerta do dashboard é substituído por `<div>` com dois sub-links; (2) um `<PageTransitionLink>` com ícone SVG é adicionado na célula "Ações" de cada linha da lista de instrumentos. Nenhuma alteração no fluxo de calibração existente.

**Tech Stack:** Next.js 14 (RSC + Client Components), TypeScript, CSS global (`app/globals.css`)

---

## File Map

| Arquivo | Mudança |
|---|---|
| `app/globals.css` | Reestrutura grid de `.dashboard-alert-item`; adiciona `.dashboard-alert-item__main` e `.dashboard-alert-item__calibrate`; atualiza responsivo e dark theme; garante `.table-action` como `inline-flex` |
| `app/_components/dashboard-content.tsx` | Substitui `<Link>` externo por `<div>` + dois `<Link>` internos em cada alert item |
| `app/_components/instruments-content.tsx` | Adiciona `<PageTransitionLink>` na célula de ações de cada linha |

---

## Task 1: CSS — Reestruturar estilos do dashboard alert item

**Files:**
- Modify: `app/globals.css:2940` (grid columns)
- Modify: `app/globals.css:3043` (add `__main` + `__calibrate` after badge styles)
- Modify: `app/globals.css:6553` (responsive)
- Modify: `app/globals.css:~7705` (dark theme)

- [ ] **Step 1: Mudar `grid-template-columns` de `.dashboard-alert-item`**

Em `app/globals.css`, localizar o bloco `.dashboard-alert-item` (linha ~2937). Mudar apenas a propriedade `grid-template-columns`:

```css
/* ANTES */
.dashboard-alert-item {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px 14px 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(16, 35, 78, 0.06);
  background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
}

/* DEPOIS */
.dashboard-alert-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px 14px 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(16, 35, 78, 0.06);
  background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
}
```

- [ ] **Step 2: Adicionar classes `__main` e `__calibrate` após `.dashboard-alert-item__badge--warning`**

Localizar o bloco `.dashboard-alert-item__badge--warning` (linha ~3040) e adicionar logo abaixo:

```css
.dashboard-alert-item__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  text-decoration: none;
}

.dashboard-alert-item__calibrate {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(13, 79, 153, 0.08);
  color: #0d4f99;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-decoration: none;
}
```

- [ ] **Step 3: Atualizar o responsivo do `dashboard-alert-item`**

No bloco da media query responsiva (linha ~6553), trocar:

```css
/* ANTES */
.dashboard-alert-item {
  grid-template-columns: auto minmax(0, 1fr);
}

.dashboard-alert-item__action {
  grid-column: 1 / -1;
  width: 100%;
}

/* DEPOIS */
.dashboard-alert-item {
  grid-template-columns: 1fr;
}

.dashboard-alert-item__action {
  grid-column: 1 / -1;
  width: 100%;
}

.dashboard-alert-item__calibrate {
  justify-content: center;
  width: 100%;
}
```

- [ ] **Step 4: Adicionar dark theme para `__calibrate`**

Localizar `html[data-theme="dark"] .dashboard-alert-item__badge--warning` (linha ~7705) e adicionar logo após:

```css
html[data-theme="dark"] .dashboard-alert-item__calibrate {
  background: rgba(74, 108, 170, 0.16);
  color: #9ec4ff;
}
```

- [ ] **Step 5: Garantir que `.table-action` use `inline-flex`**

Localizar `.table-action` (linha ~1673) e adicionar `display` e alinhamento:

```css
/* ANTES */
.table-action {
  border: 0;
  background: transparent;
  color: #0a2856;
  cursor: pointer;
}

/* DEPOIS */
.table-action {
  border: 0;
  background: transparent;
  color: #0a2856;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 6: Verificar lint**

```bash
npm run lint
```

Esperado: sem erros ou warnings novos.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "style: restructure dashboard-alert-item grid for calibration shortcut"
```

---

## Task 2: Dashboard — Reestruturar alert items com dois links

**Files:**
- Modify: `app/_components/dashboard-content.tsx:158-199`

- [ ] **Step 1: Substituir o `<Link>` externo de cada alert item**

Em `app/_components/dashboard-content.tsx`, localizar o bloco `metrics.alerts.map` (linha ~157). Substituir o `<Link>` que envolve todo o card por `<div>`, mover o conteúdo existente para um `<Link className="dashboard-alert-item__main">`, e adicionar um novo `<Link className="dashboard-alert-item__calibrate">` logo após:

```tsx
{metrics.alerts.map((alert) => (
  <div
    key={alert.tag}
    className={`dashboard-alert-item dashboard-alert-item--${alert.tone}`}
  >
    <Link href={`/instrumentos/${alert.id}`} className="dashboard-alert-item__main">
      <div className="dashboard-alert-item__icon" aria-hidden="true">
        {alert.tone === "danger" ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 7v6M12 17.2h.01M4.9 18.5h14.2c1.1 0 1.8-1.2 1.2-2.1L13.1 4.3a1.3 1.3 0 0 0-2.2 0L3.7 16.4c-.6.9.1 2.1 1.2 2.1Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 6.5v5.3l3.1 1.9M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="dashboard-alert-item__body">
        <div className="dashboard-alert-item__title-row">
          <strong>{alert.tag}</strong>
          <span>{alert.title}</span>
        </div>
        <p>{alert.note}</p>
      </div>

      <span className={`dashboard-alert-item__badge dashboard-alert-item__badge--${alert.tone}`}>
        {alert.badgeLabel}
      </span>
    </Link>

    <Link
      href={`/instrumentos/${alert.id}/calibracoes/nova`}
      className="dashboard-alert-item__calibrate"
    >
      Registrar calibração
    </Link>
  </div>
))}
```

- [ ] **Step 2: Verificar lint**

```bash
npm run lint
```

Esperado: sem erros.

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: compilação sem erros de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add app/_components/dashboard-content.tsx
git commit -m "feat: add calibration shortcut to dashboard alert items"
```

---

## Task 3: Lista de instrumentos — Adicionar botão de calibração

**Files:**
- Modify: `app/_components/instruments-content.tsx:538`

- [ ] **Step 1: Adicionar `<PageTransitionLink>` na célula de ações**

Em `app/_components/instruments-content.tsx`, localizar a célula `data-label="Ações"` na linha ~538. Substituir pelo seguinte (mantendo o botão de edição existente e adicionando o novo link):

```tsx
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
```

- [ ] **Step 2: Verificar lint**

```bash
npm run lint
```

Esperado: sem erros.

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: compilação sem erros de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add app/_components/instruments-content.tsx
git commit -m "feat: add calibration shortcut to instruments list actions"
```

---

## Task 4: Verificação final e testes manuais

- [ ] **Step 1: Executar suite completa de testes**

```bash
npm run test
```

Esperado: todos os testes passando (sem lógica de negócio nova, não deve haver regressão).

- [ ] **Step 2: Executar build de produção**

```bash
npm run build
```

Esperado: 0 erros, sem warnings de TypeScript.

- [ ] **Step 3: Subir dev server e testar manualmente**

```bash
npm run dev
```

Cheklist de validação (abrir http://localhost:3000):

- [ ] Dashboard: a área principal do card de alerta (ícone + texto + badge) navega para `/instrumentos/:id` ao clicar
- [ ] Dashboard: o botão "Registrar calibração" navega para `/instrumentos/:id/calibracoes/nova` ao clicar
- [ ] Dashboard: card mantém visual correto em light e dark theme
- [ ] Dashboard: em tela estreita (<768px), o botão "Registrar calibração" ocupa a largura total da linha
- [ ] Lista: o ícone de prancheta na coluna "Ações" navega para `/instrumentos/:id/calibracoes/nova`
- [ ] Lista: o lápis de edição ainda abre o modal corretamente
- [ ] Lista: ícone visível e alinhado corretamente ao lado do lápis

- [ ] **Step 4: Commit final e atualizar docs**

```bash
git add docs/estado/HANDOFF_IA.md docs/estado/LOGS.md
git commit -m "docs: update HANDOFF and LOGS after B4 calibration shortcuts"
```
