import { formatInstrumentAlertNote, mapInstrumentRow, type InstrumentCategoryRow, type InstrumentDbRow } from "@/lib/instruments";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DashboardInstrumentRow = ReturnType<typeof mapInstrumentRow>;

export type DashboardSummaryCard = { title: string; value: string; note?: string; tone: "positive" | "neutral" };
export type DashboardAlert = { tag: string; title: string; note: string; badgeLabel: string; tone: "warning" | "danger" };
export type DashboardBreakdownItem = { label: string; count: string; tone: "ok" | "warning" | "danger" };
export type DashboardMetrics = {
  totalInstruments: number;
  totalCategories: number;
  requiringAttentionCount: number;
  inComplianceCount: number;
  inCompliancePercentage: number;
  warningCount: number;
  dangerCount: number;
  summaryCards: DashboardSummaryCard[];
  alerts: DashboardAlert[];
  breakdown: DashboardBreakdownItem[];
};

const integerFormatter = new Intl.NumberFormat("pt-BR");

function percentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function compareAlertPriority(
  first: DashboardInstrumentRow & { tone: "warning" | "danger" },
  second: DashboardInstrumentRow & { tone: "warning" | "danger" }
) {
  if (first.tone !== second.tone) {
    return first.tone === "danger" ? -1 : 1;
  }

  return first.diffInDays - second.diffInDays;
}

async function loadDashboardRows(referenceDate: Date) {
  const [instrumentRowsResponse, categoryRowsResponse] = await Promise.all([
    supabaseAdmin
      .schema("calibracao")
      .from("instrumentos")
      .select("id, tag, categoria_id, fabricante, data_ultima_calibracao, proxima_calibracao")
      .order("id", { ascending: true }),
    supabaseAdmin
      .schema("calibracao")
      .from("categorias_instrumentos")
      .select("id, nome, slug")
      .order("nome", { ascending: true })
  ]);

  if (instrumentRowsResponse.error || categoryRowsResponse.error) {
    return {
      rows: [] as DashboardInstrumentRow[],
      totalCategories: 0
    };
  }

  const categories = (categoryRowsResponse.data ?? []) as InstrumentCategoryRow[];
  const categoriesById = new Map(categories.map((row) => [row.id, row]));
  const rows = ((instrumentRowsResponse.data ?? []) as InstrumentDbRow[]).map((row) =>
    mapInstrumentRow(row, categoriesById, referenceDate)
  );

  return {
    rows,
    totalCategories: categories.length
  };
}

export async function getDashboardMetrics(referenceDate = new Date()): Promise<DashboardMetrics> {
  const { rows, totalCategories } = await loadDashboardRows(referenceDate);
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
