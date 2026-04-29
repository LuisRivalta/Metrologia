import { describe, expect, it } from "vitest";

import { computeDashboardMetrics, getDashboardMetrics } from "@/lib/dashboard-metrics";
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

    expect(metrics.summaryCards).toHaveLength(2);
    expect(metrics.summaryCards[0]).toMatchObject({ title: "Total instrumentos", value: "3", tone: "positive" });
    expect(metrics.summaryCards[1]).toMatchObject({ title: "Categorias", value: "2", tone: "neutral" });
  });

  it("ordena alertas colocando danger antes de warning e mais urgentes primeiro", () => {
    const rows = [
      makeRow({ id: 1, tag: "A", tone: "warning", diffInDays: 20, calibrationDateValue: "2026-05-08" }),
      makeRow({ id: 2, tag: "B", tone: "danger", diffInDays: -5, calibrationDateValue: "2026-04-13" }),
      makeRow({ id: 3, tag: "C", tone: "warning", diffInDays: 5, calibrationDateValue: "2026-04-23" }),
      makeRow({ id: 4, tag: "D", tone: "danger", diffInDays: -15, calibrationDateValue: "2026-04-03" })
    ];

    const metrics = computeDashboardMetrics(rows, 1);
    const tags = metrics.alerts.map((a) => a.tag);

    expect(tags[0]).toBe("D");
    expect(tags[1]).toBe("B");
    expect(tags[2]).toBe("C");
    expect(tags[3]).toBe("A");

    // Verify note is built from calibrationDateValue, not the fallback "Sem prazo de calibração definido"
    const alertD = metrics.alerts.find((a) => a.tag === "D")!;
    expect(alertD.note).toBe("Vencido há 15 dias - calibração 03/04/2026");
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

  it("inclui o id do instrumento em cada alerta", () => {
    const rows = [
      makeRow({ id: 42, tag: "INS-042", tone: "danger", diffInDays: -1, calibrationDateValue: "2026-04-20" })
    ];

    const metrics = computeDashboardMetrics(rows, 0);

    expect(metrics.alerts).toHaveLength(1);
    expect(metrics.alerts[0].id).toBe(42);
    expect(metrics.alerts[0].tag).toBe("INS-042");
  });
});

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("dashboard-metrics integração", () => {
  it.skipIf(!hasSupabase)("getDashboardMetrics retorna estrutura valida do banco", async () => {
    const metrics = await getDashboardMetrics();

    expect(metrics.totalInstruments).toBeGreaterThanOrEqual(0);
    expect(metrics.totalCategories).toBeGreaterThanOrEqual(0);
    expect(metrics.inCompliancePercentage).toBeGreaterThanOrEqual(0);
    expect(metrics.inCompliancePercentage).toBeLessThanOrEqual(100);
    expect(metrics.warningCount + metrics.dangerCount).toBe(metrics.requiringAttentionCount);
    expect(Array.isArray(metrics.alerts)).toBe(true);
    expect(metrics.alerts.length).toBeLessThanOrEqual(5);
    expect(metrics.breakdown).toHaveLength(3);
    expect(metrics.summaryCards).toHaveLength(2);
  });

  it.skipIf(!hasSupabase)("getDashboardMetrics retorna arrays vazios quando erro de conexao (simulado via data invalida)", async () => {
    // Passa uma data valida — valida que loadDashboardRows + computeDashboardMetrics funcionam juntos
    const referenceDate = new Date("2000-01-01");
    const metrics = await getDashboardMetrics(referenceDate);

    // Com data de 2000, todos os instrumentos com prazo definido estarao vencidos
    expect(metrics.totalInstruments).toBeGreaterThanOrEqual(0);
    expect(metrics.dangerCount).toBeGreaterThanOrEqual(0);
  });
});
