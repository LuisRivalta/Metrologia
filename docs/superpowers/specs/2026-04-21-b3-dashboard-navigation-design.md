# B3 — Dashboard: Navegação por Links

**Data:** 2026-04-21  
**Status:** Aprovado

## Problema

O dashboard exibe métricas reais (alertas, conformidade, totais) mas é completamente estático — nenhum elemento é clicável. O usuário vê um instrumento vencido na lista de alertas e precisa navegar manualmente para `/instrumentos` para encontrá-lo.

## Objetivo

Tornar o dashboard navegável: alertas levam direto ao instrumento, cards de resumo levam às listagens correspondentes, e a legenda do gráfico filtra a lista de instrumentos por status.

## Escopo

- **Inclui:** links em alertas, cards de resumo e legenda do donut; inicialização do filtro de instrumentos via URL param.
- **Não inclui:** filtros no próprio dashboard, ações rápidas, mais dados/histórico.

---

## Arquitetura

### 1. Tipo `DashboardAlert` — adicionar `id`

Em `lib/dashboard-metrics.ts`, `DashboardAlert` passa a incluir `id: number`:

```ts
export type DashboardAlert = {
  id: number;
  tag: string;
  title: string;
  note: string;
  badgeLabel: string;
  tone: "warning" | "danger";
};
```

Em `computeDashboardMetrics`, o mapeamento de alertas inclui `id: row.id`. A query em `loadDashboardRows` já seleciona `id` da tabela `instrumentos`.

### 2. `dashboard-content.tsx` — adicionar `<Link>`

Importa `Link` de `next/link`. O componente continua RSC.

**Alertas:**  
Cada `<article>` da lista de alertas vira `<Link href={"/instrumentos/" + alert.id}>`. O `<article>` interno mantém suas classes atuais.

**Cards de resumo:**  
- Card "Total instrumentos" → `<Link href="/instrumentos">`
- Card "Categorias" → `<Link href="/categorias">`

O wrapper externo do card (`<article>`) vira `<Link>` com as mesmas classes.

**Legenda do donut:**  
Cada linha da legenda (`dashboard-status-card__legend-row`) vira `<Link>`. O `href` usa o mapeamento de tom para o valor do filtro:

| `item.tone` | `href` |
|-------------|--------|
| `"ok"` | `/instrumentos?status=neutral` |
| `"warning"` | `/instrumentos?status=warning` |
| `"danger"` | `/instrumentos?status=danger` |

O mapeamento é necessário porque `DashboardBreakdownItem` usa `"ok"` mas o filtro em `instruments-content.tsx` usa `"neutral"`.

### 3. `instruments-content.tsx` — inicializar filtro por URL

Importa `useSearchParams` de `next/navigation`. Ao montar o componente, lê `searchParams.get("status")`. Se o valor for `"neutral"`, `"warning"` ou `"danger"`, usa como valor inicial do `calibrationFilter`; caso contrário, cai em `"all"`.

```ts
const searchParams = useSearchParams();
const initialStatus = searchParams.get("status");
const validStatuses: CalibrationFilter[] = ["neutral", "warning", "danger"];
const [calibrationFilter, setCalibrationFilter] = useState<CalibrationFilter>(
  validStatuses.includes(initialStatus as CalibrationFilter)
    ? (initialStatus as CalibrationFilter)
    : "all"
);
```

Nenhuma outra mudança nesse arquivo.

---

## Testes

- `computeDashboardMetrics` em `tests/lib/dashboard-metrics.test.ts`: verificar que `alerts[0].id` está presente no retorno.
- Não há teste unitário para os componentes (UI); validar manualmente navegando do dashboard para instrumento e para lista filtrada.

---

## Sequência de implementação

1. Adicionar `id` a `DashboardAlert` + teste unitário
2. Atualizar `dashboard-content.tsx` com `<Link>` nos três pontos
3. Atualizar `instruments-content.tsx` com `useSearchParams`
