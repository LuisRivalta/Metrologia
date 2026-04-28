---
tags: [historico, plano, testes]
feature: Technical Health — Cobertura de Testes
data: 2026-04-18
---
# Technical Health — Cobertura de Testes e Melhorias de Arquitetura

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrir os caminhos de negócio mais críticos com testes automatizados, garantindo que bugs silenciosos sejam detectados antes de chegar à produção.

**Architecture:** Abordagem orientada a risco — P0 primeiro (dashboard, instrumentos, calibrações), P1 depois (certificados, campos), P2 oportunisticamente (medidas). Onde a lógica está acoplada a Supabase, extrair função pura antes de testar.

**Tech Stack:** Vitest, TypeScript, alias `@` para raiz do projeto. Testes em `tests/lib/`. Comandos: `npx vitest run tests/lib/<arquivo>.test.ts` para rodar um arquivo, `npm run test` para a suite completa.

---

## Task 1: Extrair lógica pura de `dashboard-metrics.ts` e testar

`getDashboardMetrics` está com 0% de cobertura porque chama Supabase diretamente. A solução é extrair a computação para uma função pura testável.

**Files:**
- Modify: `lib/dashboard-metrics.ts`
- Test: `tests/lib/dashboard-metrics.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/lib/dashboard-metrics.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

import { computeDashboardMetrics } from "@/lib/dashboard-metrics";
import type { InstrumentItem } from "@/lib/instruments";

function makeRow(overrides: Partial<InstrumentItem> = {}): InstrumentItem {
  return {
    id: 1,
    tag: "PAQ-001",
    category: "Paquimetro",
    manufacturer: "Mitutoyo",
    calibration: "Sem prazo definido",
    tone: "neutral",
    diffInDays: 0,
    ...overrides
  };
}

describe("dashboard-metrics", () => {
  it("retorna zeros quando nao ha instrumentos", () => {
    const metrics = computeDashboardMetrics([], 0);

    expect(metrics.totalInstruments).toBe(0);
    expect(metrics.totalCategories).toBe(0);
    expect(metrics.inCompliancePercentage).toBe(0);
    expect(metrics.alerts).toHaveLength(0);
  });

  it("calcula percentual de conformidade corretamente", () => {
    const rows = [
      makeRow({ tone: "neutral" }),
      makeRow({ tone: "warning" }),
      makeRow({ tone: "danger" })
    ];

    const metrics = computeDashboardMetrics(rows, 2);

    expect(metrics.totalInstruments).toBe(3);
    expect(metrics.totalCategories).toBe(2);
    expect(metrics.inComplianceCount).toBe(2);
    expect(metrics.inCompliancePercentage).toBe(67);
    expect(metrics.warningCount).toBe(1);
    expect(metrics.dangerCount).toBe(1);
    expect(metrics.requiringAttentionCount).toBe(2);
  });

  it("ordena alertas colocando danger antes de warning e mais urgentes primeiro", () => {
    const rows = [
      makeRow({ id: 1, tag: "A", tone: "warning", diffInDays: 20 }),
      makeRow({ id: 2, tag: "B", tone: "danger", diffInDays: -5 }),
      makeRow({ id: 3, tag: "C", tone: "warning", diffInDays: 5 }),
      makeRow({ id: 4, tag: "D", tone: "danger", diffInDays: -15 })
    ];

    const metrics = computeDashboardMetrics(rows, 1);
    const tags = metrics.alerts.map((a) => a.tag);

    expect(tags[0]).toBe("D");
    expect(tags[1]).toBe("B");
    expect(tags[2]).toBe("C");
    expect(tags[3]).toBe("A");
  });

  it("limita os alertas a 5 itens", () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      makeRow({ id: i + 1, tag: `INS-${i + 1}`, tone: "danger", diffInDays: -i })
    );

    expect(computeDashboardMetrics(rows, 1).alerts).toHaveLength(5);
  });

  it("monta o breakdown com os tres grupos", () => {
    const rows = [
      makeRow({ tone: "neutral" }),
      makeRow({ tone: "neutral" }),
      makeRow({ tone: "warning" }),
      makeRow({ tone: "danger" })
    ];

    const breakdown = computeDashboardMetrics(rows, 1).breakdown;

    expect(breakdown).toHaveLength(3);
    expect(breakdown[0]).toMatchObject({ label: "Em dia", tone: "ok" });
    expect(breakdown[1]).toMatchObject({ label: "Perto de vencer", tone: "warning" });
    expect(breakdown[2]).toMatchObject({ label: "Vencidos", tone: "danger" });
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run tests/lib/dashboard-metrics.test.ts
```

Esperado: FAIL — `computeDashboardMetrics is not exported`

- [ ] **Step 3: Extrair função pura em `lib/dashboard-metrics.ts`**

Substituir o corpo de `getDashboardMetrics` por uma chamada à nova função pura. Adicionar a exportação `computeDashboardMetrics` logo antes de `getDashboardMetrics`:

```typescript
export function computeDashboardMetrics(
  rows: DashboardInstrumentRow[],
  totalCategories: number
): DashboardMetrics {
  const totalInstruments = rows.length;
  const okCount = rows.filter((row) => row.tone === "neutral").length;
  const warningCount = rows.filter((row) => row.tone === "warning").length;
  const dangerCount = rows.filter((row) => row.tone === "danger").length;
  const inComplianceCount = rows.filter((row) => row.tone !== "danger").length;
  const requiringAttentionCount = warningCount + dangerCount;
  const inCompliancePercentage = percentage(inComplianceCount, totalInstruments);

  const summaryCards: DashboardSummaryCard[] = [
    { title: "Total instrumentos", value: integerFormatter.format(totalInstruments), tone: "positive" },
    { title: "Categorias", value: integerFormatter.format(totalCategories), tone: "neutral" }
  ];

  const alerts = rows
    .filter((row): row is DashboardInstrumentRow & { tone: "warning" | "danger" } => row.tone !== "neutral")
    .sort(compareAlertPriority)
    .slice(0, 5)
    .map((row) => ({
      tag: row.tag,
      title: `${row.category} - ${row.manufacturer}`,
      note: formatInstrumentAlertNote(row.calibrationDateValue ?? null, row.diffInDays),
      badgeLabel: row.tone === "danger" ? "Vencido" : "Perto de vencer",
      tone: row.tone
    }));

  const breakdown: DashboardBreakdownItem[] = [
    { label: "Em dia", count: integerFormatter.format(okCount), tone: "ok" },
    { label: "Perto de vencer", count: integerFormatter.format(warningCount), tone: "warning" },
    { label: "Vencidos", count: integerFormatter.format(dangerCount), tone: "danger" }
  ];

  return {
    totalInstruments,
    totalCategories,
    requiringAttentionCount,
    inComplianceCount,
    inCompliancePercentage,
    warningCount,
    dangerCount,
    summaryCards,
    alerts,
    breakdown
  };
}

export async function getDashboardMetrics(referenceDate = new Date()): Promise<DashboardMetrics> {
  const { rows, totalCategories } = await loadDashboardRows(referenceDate);
  return computeDashboardMetrics(rows, totalCategories);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run tests/lib/dashboard-metrics.test.ts
```

Esperado: 5 testes passando.

- [ ] **Step 5: Confirmar suite completa verde**

```bash
npm run test
```

Esperado: todos os testes passando.

- [ ] **Step 6: Commit**

```bash
git add lib/dashboard-metrics.ts tests/lib/dashboard-metrics.test.ts
git commit -m "test: cobrir dashboard-metrics com funcao pura computeDashboardMetrics"
```

---

## Task 2: Cobrir branches descobertos em `instruments.ts`

Linhas descobertas: 167 (far-future description em meses), 176 (null date em `formatInstrumentCalibration`), 201–216 (`formatInstrumentAlertNote`).

**Files:**
- Modify: `tests/lib/instruments.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao bloco `describe("instruments", ...)` em `tests/lib/instruments.test.ts`:

```typescript
  it("descreve calibracao futura distante em meses", () => {
    expect(getRelativeCalibration("2026-08-01", referenceDate)).toEqual({
      tone: "neutral",
      diffInDays: 122,
      description: "Vence em 5 meses"
    });
  });

  it("trata data nula em formatInstrumentCalibration como sem prazo", () => {
    expect(formatInstrumentCalibration(null, referenceDate)).toEqual({
      calibration: "Sem prazo definido",
      tone: "neutral",
      diffInDays: 0
    });
  });

  it("formata nota de alerta para instrumento sem data de calibracao", () => {
    expect(formatInstrumentAlertNote(null, 0)).toBe("Sem prazo de calibração definido");
  });

  it("formata nota de alerta para instrumento vencido", () => {
    expect(formatInstrumentAlertNote("2026-03-15", -17)).toBe(
      "Vencido há 17 dias - calibração 15/03/2026"
    );
  });

  it("formata nota de alerta no singular para instrumento vencido ha 1 dia", () => {
    expect(formatInstrumentAlertNote("2026-03-31", -1)).toBe(
      "Vencido há 1 dia - calibração 31/03/2026"
    );
  });

  it("formata nota de alerta para instrumento perto de vencer", () => {
    expect(formatInstrumentAlertNote("2026-04-15", 14)).toBe(
      "Vence em 14 dias - calibração 15/04/2026"
    );
  });

  it("formata nota de alerta com data invalida", () => {
    expect(formatInstrumentAlertNote("2026-02-31", -1)).toContain("invalido");
  });
```

- [ ] **Step 2: Importar `formatInstrumentAlertNote`**

Verificar que `formatInstrumentAlertNote` está no import no topo do arquivo:

```typescript
import {
  buildInstrumentDisplayTag,
  formatInstrumentAlertNote,
  formatInstrumentCalibration,
  getRelativeCalibration,
  mergeInstrumentFieldsWithLatestCalibration,
  mapInstrumentRow
} from "@/lib/instruments";
```

- [ ] **Step 3: Rodar e confirmar que falha**

```bash
npx vitest run tests/lib/instruments.test.ts
```

Esperado: novos testes falhando (função não importada ou assertion errada).

- [ ] **Step 4: Rodar e confirmar que passa após ajustar imports**

Após adicionar `formatInstrumentAlertNote` ao import:

```bash
npx vitest run tests/lib/instruments.test.ts
```

Esperado: todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add tests/lib/instruments.test.ts
git commit -m "test: cobrir branches de prazo e nota de alerta em instruments"
```

---

## Task 3: Cobrir branches descobertos em `calibrations.ts`

Linhas descobertas: `getCalibrationFilterStartDate` (todos os presets), `getStatusToneFromLabel`, `deriveStatus` com validade de data, `mapCalibrationHistoryRow` com resultado de DB.

**Files:**
- Modify: `tests/lib/calibrations.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao arquivo `tests/lib/calibrations.test.ts`. Primeiro, adicionar os imports necessários no topo:

```typescript
import {
  getCalibrationFilterStartDate,
  isCalibrationFilterPreset,
  isCalibrationStatusValue,
  mapCalibrationHistoryRow,
  type CalibrationDbRow,
  type CalibrationResultDbRow
} from "@/lib/calibrations";
```

Depois adicionar dentro do `describe`:

```typescript
  it("calcula data de inicio do filtro para cada preset", () => {
    const ref = new Date(2026, 3, 18); // 2026-04-18

    expect(getCalibrationFilterStartDate("3m", ref)).toBe("2026-01-18");
    expect(getCalibrationFilterStartDate("6m", ref)).toBe("2025-10-18");
    expect(getCalibrationFilterStartDate("1y", ref)).toBe("2025-04-18");
    expect(getCalibrationFilterStartDate("3y", ref)).toBe("2023-04-18");
    expect(getCalibrationFilterStartDate("5y", ref)).toBe("2021-04-18");
  });

  it("valida preset de filtro corretamente", () => {
    expect(isCalibrationFilterPreset("3m")).toBe(true);
    expect(isCalibrationFilterPreset("2y")).toBe(false);
    expect(isCalibrationFilterPreset("")).toBe(false);
  });

  it("valida status de calibracao corretamente", () => {
    expect(isCalibrationStatusValue("Aprovado")).toBe(true);
    expect(isCalibrationStatusValue("Reprovado")).toBe(true);
    expect(isCalibrationStatusValue("invalido")).toBe(false);
  });

  it("deriva status danger quando data de validade esta vencida", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({ data_validade: "2025-01-01" }),
      []
    );

    expect(item.statusTone).toBe("danger");
    expect(item.statusLabel).toBe("Vencido");
  });

  it("deriva status warning quando data de validade esta proxima", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({ data_validade: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10) }),
      []
    );

    expect(item.statusTone).toBe("warning");
  });

  it("usa status explicitamente gravado no banco quando presente", () => {
    const item = mapCalibrationHistoryRow(
      createCalibrationRow({ status_geral: "Aprovado" }),
      []
    );

    expect(item.statusLabel).toBe("Aprovado");
    expect(item.statusTone).toBe("neutral");
  });

  it("usa resultados do banco quando observacoes nao tem payload estruturado", () => {
    const results: CalibrationResultDbRow[] = [
      { id: 1, calibracao_id: 17, instrumento_campo_medicao_id: 5, conforme: true, created_at: "" },
      { id: 2, calibracao_id: 17, instrumento_campo_medicao_id: 6, conforme: false, created_at: "" }
    ];

    const item = mapCalibrationHistoryRow(createCalibrationRow({ observacoes: "Texto livre" }), results);

    expect(item.totalResults).toBe(2);
    expect(item.conformingResults).toBe(1);
    expect(item.nonConformingResults).toBe(1);
    expect(item.statusTone).toBe("danger");
  });
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run tests/lib/calibrations.test.ts
```

Esperado: novos testes falhando por imports ausentes.

- [ ] **Step 3: Rodar e confirmar que passa após corrigir imports**

```bash
npx vitest run tests/lib/calibrations.test.ts
```

Esperado: todos passando.

- [ ] **Step 4: Commit**

```bash
git add tests/lib/calibrations.test.ts
git commit -m "test: cobrir filtros, status e deriveStatus em calibrations"
```

---

## Task 4: Cobrir `calibration-certificates.ts` (P1)

Linhas descobertas: 53–70 — função `getCalibrationCertificateStoragePathFromUrl` completa.

**Files:**
- Modify: `tests/lib/calibration-certificates.test.ts`

- [ ] **Step 1: Ler o arquivo de testes existente**

```bash
cat tests/lib/calibration-certificates.test.ts
```

- [ ] **Step 2: Escrever os testes que faltam**

Adicionar ao `describe` existente em `tests/lib/calibration-certificates.test.ts`:

```typescript
import {
  getCalibrationCertificateStoragePathFromUrl,
  isPdfCertificateFile,
  sanitizeStoragePathSegment
} from "@/lib/calibration-certificates";

// (adicionar dentro do describe existente ou criar novo describe)

describe("getCalibrationCertificateStoragePathFromUrl", () => {
  const bucket = "shiftapp-files";

  it("extrai o storage path de uma URL valida", () => {
    const url = `https://cdn.example.com/storage/v1/object/public/${bucket}/metrologia/calibracoes/paq/calibracao-1-20260418120000-cert.pdf`;

    expect(getCalibrationCertificateStoragePathFromUrl(url)).toBe(
      "metrologia/calibracoes/paq/calibracao-1-20260418120000-cert.pdf"
    );
  });

  it("retorna null para URL de outro bucket", () => {
    const url = "https://cdn.example.com/storage/v1/object/public/outro-bucket/arquivo.pdf";

    expect(getCalibrationCertificateStoragePathFromUrl(url)).toBeNull();
  });

  it("retorna null para string vazia", () => {
    expect(getCalibrationCertificateStoragePathFromUrl("")).toBeNull();
  });

  it("retorna null para URL malformada", () => {
    expect(getCalibrationCertificateStoragePathFromUrl("nao-e-uma-url")).toBeNull();
  });
});

describe("isPdfCertificateFile", () => {
  it("aceita arquivo com mime type correto", () => {
    expect(isPdfCertificateFile("qualquer.txt", "application/pdf")).toBe(true);
  });

  it("aceita arquivo com extensao .pdf sem mime type", () => {
    expect(isPdfCertificateFile("certificado.pdf")).toBe(true);
  });

  it("rejeita arquivo sem extensao pdf e sem mime type correto", () => {
    expect(isPdfCertificateFile("imagem.png", "image/png")).toBe(false);
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

```bash
npx vitest run tests/lib/calibration-certificates.test.ts
```

Esperado: FAIL — funções não importadas ou assertions erradas.

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run tests/lib/calibration-certificates.test.ts
```

Esperado: todos passando.

- [ ] **Step 5: Commit**

```bash
git add tests/lib/calibration-certificates.test.ts
git commit -m "test: cobrir getCalibrationCertificateStoragePathFromUrl e isPdfCertificateFile"
```

---

## Task 5: Cobrir `measurement-fields.ts` — mapeamento de campos (P1)

`mapMeasurementFieldRow` é privada, mas tem dois wrappers públicos exportados: `mapInstrumentMeasurementFieldRow` e `mapCategoryMeasurementFieldRow`. Testar via esses wrappers.

**Files:**
- Modify: `tests/lib/measurement-fields.test.ts`

- [ ] **Step 1: Escrever os testes que faltam**

Adicionar ao `describe` existente em `tests/lib/measurement-fields.test.ts`:

```typescript
import {
  groupMeasurementFieldsByLayout,
  hasMeasurementFieldGrouping,
  mapCategoryMeasurementFieldRow,
  mapInstrumentMeasurementFieldRow,
  parseMeasurementFieldValueConfig,
  serializeMeasurementFieldSlug,
  serializeMeasurementFieldValueConfig,
  sortMeasurementFields
} from "@/lib/measurement-fields";
import type { MeasurementRow } from "@/lib/measurement-fields";

// Adicionar dentro do describe existente:

  it("mapeia linha de campo de instrumento para MeasurementFieldItem", () => {
    const measurementsById = new Map<number, MeasurementRow>([
      [1, { id: 1, tipo: "mm", tipo_desc: "Milimetros" }]
    ]);

    const row = {
      id: 10,
      nome: "Maior erro externo",
      slug: "maior-erro-externo",
      unidade_medida_id: 1,
      tipo_valor: "numero",
      ordem: 0,
      ativo: null,
      instrumento_id: null,
      categoria_campo_medicao_id: null
    };

    const item = mapInstrumentMeasurementFieldRow(row, measurementsById);

    expect(item.dbId).toBe(10);
    expect(item.name).toBe("Maior erro externo");
    expect(item.slug).toBe("maior-erro-externo");
    expect(item.measurementName).toBe("mm");
    expect(item.valueType).toBe("numero");
    expect(item.hint).toBeUndefined();
  });

  it("mapeia hint de campo de categoria quando presente", () => {
    const measurementsById = new Map<number, MeasurementRow>();

    const row = {
      id: 20,
      nome: "Capacidade",
      slug: "capacidade",
      unidade_medida_id: null,
      tipo_valor: "numero",
      ordem: 0,
      ativo: null,
      categoria_id: null,
      dica_extracao: "  pode estar no cabecalho  "
    };

    const item = mapCategoryMeasurementFieldRow(row, measurementsById);

    expect(item.hint).toBe("pode estar no cabecalho");
  });

  it("deriva slug quando linha nao tem slug preenchido", () => {
    const measurementsById = new Map<number, MeasurementRow>();

    const row = {
      id: 30,
      nome: "Erro",
      slug: "",
      unidade_medida_id: null,
      tipo_valor: JSON.stringify({ type: "numero", groupName: "Tensao", subgroupName: "Fase A" }),
      ordem: 0,
      ativo: null,
      instrumento_id: null,
      categoria_campo_medicao_id: null
    };

    const item = mapInstrumentMeasurementFieldRow(row, measurementsById);

    expect(item.slug).toBe("tensao-fase-a-erro");
    expect(item.groupName).toBe("Tensao");
    expect(item.subgroupName).toBe("Fase A");
  });

  it("hasMeasurementFieldGrouping retorna true quando algum campo tem grupo", () => {
    expect(hasMeasurementFieldGrouping([{ groupName: "Grupo A" }, {}])).toBe(true);
    expect(hasMeasurementFieldGrouping([{}, {}])).toBe(false);
  });
```

- [ ] **Step 2: Adicionar imports no topo do arquivo de teste**

`MeasurementRow` é exportado de `@/lib/measurements`, não de `measurement-fields`:

```typescript
import { type MeasurementRow } from "@/lib/measurements";
import {
  groupMeasurementFieldsByLayout,
  hasMeasurementFieldGrouping,
  mapCategoryMeasurementFieldRow,
  mapInstrumentMeasurementFieldRow,
  parseMeasurementFieldValueConfig,
  serializeMeasurementFieldSlug,
  serializeMeasurementFieldValueConfig
} from "@/lib/measurement-fields";
```

- [ ] **Step 3: Rodar e confirmar que falha**

```bash
npx vitest run tests/lib/measurement-fields.test.ts
```

Esperado: FAIL — imports faltando ou tipos incompatíveis.

- [ ] **Step 4: Ajustar imports e tipos até passar**

```bash
npx vitest run tests/lib/measurement-fields.test.ts
```

Esperado: todos passando.

- [ ] **Step 5: Commit**

```bash
git add lib/measurement-fields.ts tests/lib/measurement-fields.test.ts
git commit -m "test: cobrir mapeamento de campos e hint em measurement-fields"
```

---

## Task 6: Cobrir gaps em `measurements.ts` (P2)

Linhas descobertas: 127–132 (regex de `formatMeasurementType` para unidades especiais), 141 (`serializeMeasurementType` com lookup).

**Files:**
- Modify: `tests/lib/measurements.test.ts`

- [ ] **Step 1: Ler o teste existente e identificar o que falta**

```bash
npx vitest run tests/lib/measurements.test.ts --reporter=verbose
```

- [ ] **Step 2: Escrever os testes que faltam**

As linhas descobertas são regex que só disparam quando a entrada NÃO está no lookup exato mas contém os padrões como parte de uma string maior. Adicionar ao `describe` existente em `tests/lib/measurements.test.ts`:

```typescript
  it("formata variante HR nao presente no lookup exato", () => {
    // "hra", "hrb", "hrc", "hrd" estao no lookup; "hre" nao esta
    expect(formatMeasurementType("hre")).toBe("HRE");
  });

  it("formata compostos onde db, ph, hz aparecem junto de outra unidade", () => {
    // "db" isolado esta no lookup, mas "nivel_db" nao esta
    expect(formatMeasurementType("nivel_db")).toBe("nivel dB");
    expect(formatMeasurementType("valor_ph")).toBe("valor pH");
    expect(formatMeasurementType("frequencia_hz")).toBe("frequencia Hz");
  });

  it("formata ra e rz em contexto composto", () => {
    // "ra" isolado esta no lookup como "Ra", mas "rugosidade_ra" nao esta
    expect(formatMeasurementType("rugosidade_ra")).toBe("rugosidade Ra");
    expect(formatMeasurementType("rugosidade_rz")).toBe("rugosidade Rz");
  });

  it("serializa unidades com simbolos Unicode e potencias", () => {
    expect(serializeMeasurementType("Shore A")).toBe("shore_a");
    expect(serializeMeasurementType("m\u00B2")).toBe("m2");
    expect(serializeMeasurementType("m\u00B3")).toBe("m3");
  });
```

- [ ] **Step 3: Verificar imports de `formatMeasurementType` e `serializeMeasurementType`**

Confirmar que ambas estão exportadas em `lib/measurements.ts` e importadas no teste.

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run tests/lib/measurements.test.ts
```

Esperado: todos passando.

- [ ] **Step 5: Confirmar suite completa verde**

```bash
npm run test
```

Esperado: todos os testes passando, sem regressões.

- [ ] **Step 6: Commit**

```bash
git add tests/lib/measurements.test.ts
git commit -m "test: cobrir formatMeasurementType e serializeMeasurementType"
```

---

## Verificação Final

- [ ] Rodar suite completa

```bash
npm run test
```

Esperado: todos os testes passando.

- [ ] Checar cobertura para confirmar progresso

```bash
npm run test:coverage
```

Esperado: `dashboard-metrics.ts` acima de 80%, todos os P0 com cobertura significativa nos caminhos críticos.

- [ ] Rodar build de produção para garantir que o refactor não quebrou nada

```bash
npm run build
```

Esperado: build concluído sem erros.
## Relacionado
- [[historico/specs/2026-04-18-technical-health-design]] — spec desta feature
- [[testes/TDD]] — estratégia de testes
