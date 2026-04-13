import { notFound } from "next/navigation";
import { InstrumentCalibrationCreateContent } from "@/app/_components/instrument-calibration-create-content";
import { ManagementShell } from "@/app/_components/management-shell";

type InstrumentCalibrationCreatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InstrumentCalibrationCreatePage({
  params
}: InstrumentCalibrationCreatePageProps) {
  const { id } = await params;
  const instrumentId = Number(id);

  if (!Number.isFinite(instrumentId) || instrumentId <= 0) {
    notFound();
  }

  return (
    <ManagementShell activeItem="instrumentos">
      <InstrumentCalibrationCreateContent instrumentId={instrumentId} />
    </ManagementShell>
  );
}
