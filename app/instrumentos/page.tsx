import { Suspense } from "react";
import { InstrumentsContent } from "../_components/instruments-content";
import { ManagementShell } from "../_components/management-shell";

export default function InstrumentosPage() {
  return (
    <ManagementShell activeItem="instrumentos">
      <Suspense fallback={null}>
        <InstrumentsContent />
      </Suspense>
    </ManagementShell>
  );
}
