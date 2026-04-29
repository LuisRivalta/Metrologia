import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    schema: () => ({
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: { message: "connection failed" } })
        })
      })
    })
  }
}));

describe("dashboard-metrics — erro de banco", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("getDashboardMetrics retorna metricas zeradas quando o banco falha", async () => {
    const { getDashboardMetrics } = await import("@/lib/dashboard-metrics");
    const metrics = await getDashboardMetrics();

    expect(metrics.totalInstruments).toBe(0);
    expect(metrics.totalCategories).toBe(0);
    expect(metrics.requiringAttentionCount).toBe(0);
    expect(metrics.alerts).toHaveLength(0);
    expect(metrics.inCompliancePercentage).toBe(0);
  });
});
