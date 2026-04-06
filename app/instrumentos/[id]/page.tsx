import { notFound } from "next/navigation";
import { InstrumentDetailContent } from "@/app/_components/instrument-detail-content";
import { ManagementShell } from "@/app/_components/management-shell";

type InstrumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InstrumentDetailPage({
  params
}: InstrumentDetailPageProps) {
  const { id } = await params;
  const instrumentId = Number(id);

  if (!Number.isFinite(instrumentId) || instrumentId <= 0) {
    notFound();
  }

  return (
    <ManagementShell activeItem="instrumentos">
      <InstrumentDetailContent instrumentId={instrumentId} />
    </ManagementShell>
  );
}
