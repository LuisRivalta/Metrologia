import { notFound } from "next/navigation";
import { InstrumentCalibrationsContent } from "@/app/_components/instrument-calibrations-content";
import { ManagementShell } from "@/app/_components/management-shell";

type InstrumentCalibrationsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InstrumentCalibrationsPage({
  params
}: InstrumentCalibrationsPageProps) {
  const { id } = await params;
  const instrumentId = Number(id);

  if (!Number.isFinite(instrumentId) || instrumentId <= 0) {
    notFound();
  }

  return (
    <ManagementShell activeItem="instrumentos">
      <InstrumentCalibrationsContent instrumentId={instrumentId} />
    </ManagementShell>
  );
}
