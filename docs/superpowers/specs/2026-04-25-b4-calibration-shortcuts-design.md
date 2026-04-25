# B4: Atalhos de Registro de Calibração

**Data:** 2026-04-25
**Status:** Aprovado

## Objetivo

Reduzir o número de cliques para iniciar um registro de calibração. Hoje o usuário precisa: entrar na lista → clicar na tag → navegar para calibrações → clicar em "Nova calibração". Com esta feature, um único clique a partir do dashboard ou da lista de instrumentos já inicia o fluxo.

## Escopo

Dois pontos de entrada novos, ambos navegando para a rota existente `/instrumentos/[id]/calibracoes/nova`:

1. **Dashboard** — botão "Registrar calibração" em cada card da lista de alertas de vencimento.
2. **Lista de instrumentos** — ícone de atalho na coluna "Ações" de todas as linhas da tabela.

Nenhuma alteração no fluxo de criação de calibração em si.

## Arquitetura

### 1. Dashboard (`app/_components/dashboard-content.tsx`)

**Mudança:** o `<Link>` que envolve cada `dashboard-alert-item` é substituído por um `<div>`. O layout interno passa a ter dois elementos de navegação:

- `dashboard-alert-item__main` — `<Link href="/instrumentos/:id">` contendo ícone, corpo (tag, título, nota) e badge. Ocupa o espaço restante via `flex: 1`.
- `dashboard-alert-item__calibrate` — `<Link href="/instrumentos/:id/calibracoes/nova">` estilizado como botão secundário compacto, texto "Registrar calibração".

O componente permanece RSC puro — sem `'use client'`, sem estado.

**CSS:** `.dashboard-alert-item` muda de `grid-template-columns: auto minmax(0,1fr) auto` para `minmax(0,1fr) auto`. `__main` vira um `<Link>` com `display: flex; align-items: center; gap: 12px` carregando ícone, corpo e badge. `.dashboard-alert-item__calibrate` é o novo seletor para o botão secundário (evita colisão com `__action` já existente no CSS responsivo).

### 2. Lista de instrumentos (`app/_components/instruments-content.tsx`)

**Mudança:** na célula `Ações` de cada linha da tabela, adicionar um `<PageTransitionLink>` com:

- `href`: `/instrumentos/${row.id}/calibracoes/nova`
- `className`: `table-action` (mesma classe do botão de editar)
- `aria-label`: `"Registrar calibração"`
- Ícone SVG inline de prancheta (consistente com o restante do app, sem emoji)

Nenhum estado novo. Nenhuma prop nova em tipos existentes.

## Fluxo de dados

```
Usuário clica "Registrar calibração"
  → navegação client-side para /instrumentos/:id/calibracoes/nova
  → página existente carrega InstrumentCalibrationCreateContent
  → fluxo de upload de PDF + extração IA existente
```

## Acessibilidade

- Todos os links de ação têm `aria-label` descritivo.
- A área clicável do card de alerta do dashboard é explicitamente separada em dois alvos de foco distintos — melhora em relação ao estado atual (card inteiro como único alvo).

## Testes

Sem lógica de negócio nova — não são necessários testes unitários. Validação manual:

- [ ] Dashboard: clicar na área principal do card navega para `/instrumentos/:id`
- [ ] Dashboard: clicar em "Registrar calibração" navega para `/instrumentos/:id/calibracoes/nova`
- [ ] Lista: clicar no ícone de prancheta navega para `/instrumentos/:id/calibracoes/nova`
- [ ] Lista: clicar no lápis ainda abre o modal de edição
- [ ] Nenhum alerta de lint / erros de build (`npm run build`)

## Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `app/_components/dashboard-content.tsx` | Reestrutura `<Link>` externo + adiciona `__calibrate` link |
| `app/_components/instruments-content.tsx` | Adiciona `PageTransitionLink` na célula de ações |
| `app/globals.css` | Ajuste de seletores `.dashboard-alert-item` (grid columns + `__main` + `__calibrate`) |

## O que está fora do escopo

- Nenhuma mudança no fluxo de criação de calibração.
- Nenhuma ação rápida inline (modal dentro do dashboard ou da lista).
- Nenhuma filtragem do botão por status de vencimento — aparece para todos os instrumentos.
