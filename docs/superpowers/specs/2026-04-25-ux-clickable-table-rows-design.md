# UX: Linhas Clicáveis na Lista de Instrumentos

**Data:** 2026-04-25
**Status:** Aprovado

## Objetivo

Tornar cada linha da tabela de instrumentos clicável em sua totalidade, navegando para o detalhe do instrumento. Atualmente só a tag pill na primeira coluna é um link. Com esta mudança, clicar em qualquer parte da linha (exceto nos botões de ação) navega para `/instrumentos/:id`, com feedback visual de hover.

## Escopo

Um único componente afetado: `app/_components/instruments-content.tsx`. Ajuste de CSS em `app/globals.css`.

Nenhuma alteração em rotas, API ou lógica de negócio.

## Arquitetura

### `app/_components/instruments-content.tsx`

1. **Import**: adicionar `useRouter` de `next/navigation`.
2. **No componente**: `const router = useRouter()` após os outros hooks.
3. **No `<tr>`**: adicionar `className="inventory-table__row--clickable"` e `onClick={() => router.push(`/instrumentos/${row.id}`)}`.
4. **Tag pill**: adicionar `onClick={e => e.stopPropagation()}` ao `<PageTransitionLink>` existente. Isso evita que o clique na tag dispare tanto o link quanto o `router.push` do `<tr>` (ambos iriam para a mesma URL, mas seria dupla navegação). O stopPropagation preserva o comportamento do link (incluindo clique do meio para nova aba).
5. **Coluna Ações**: envolver os dois botões (editar + registrar calibração) em um `<div onClick={e => e.stopPropagation()}>`. Isso impede que cliques nos botões de ação propaguem para o handler da linha.

### `app/globals.css`

Duas novas regras após `.inventory-table__row--loading td` (linha ~1477):

```css
.inventory-table__row--clickable {
  cursor: pointer;
}

.inventory-table__row--clickable:hover td {
  background: rgba(13, 79, 153, 0.04);
}
```

Dark theme (após `html[data-theme="dark"] .inventory-table__row--loading td`):

```css
html[data-theme="dark"] .inventory-table__row--clickable:hover td {
  background: rgba(74, 108, 170, 0.07);
}
```

Em mobile (tela estreita), as linhas já viram cards (`display: block`). O hover não se aplica em touch, mas o `cursor: pointer` e o `onClick` funcionam normalmente em tap.

## Fluxo de dados

```
Usuário clica em qualquer célula da linha (exceto Ações)
  → onClick no <tr> dispara
  → router.push(`/instrumentos/${row.id}`)
  → navegação client-side para página de detalhe

Usuário clica nos botões de ação
  → stopPropagation no <div> wrapper
  → onClick do <tr> não dispara
  → comportamento original (modal de edição ou navegação para calibração)
```

## Acessibilidade

- `cursor: pointer` sinaliza visualmente que a linha é interativa.
- A tag pill `<PageTransitionLink>` permanece como elemento focável via teclado — usuários de teclado ainda navegam normalmente via Tab + Enter na tag.
- O hover de fundo é sutil (opacidade baixa) para não interferir com o status de calibração colorido da última coluna.

## Testes

Sem lógica de negócio nova. Validação manual:

- [ ] Clicar em qualquer célula (Tag, Categoria, Fabricante, Setor, Prazo) navega para `/instrumentos/:id`
- [ ] Clicar no botão de editar abre o modal (não navega)
- [ ] Clicar no ícone de calibração navega para `/instrumentos/:id/calibracoes/nova` (não para detalhe)
- [ ] Hover na linha exibe fundo sutil em light e dark theme
- [ ] Build sem erros (`npm run build`)

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `app/_components/instruments-content.tsx` | `useRouter`, `onClick` no `<tr>`, `stopPropagation` wrapper nas ações |
| `app/globals.css` | 3 novas regras CSS (`__row--clickable`, hover light, hover dark) |
