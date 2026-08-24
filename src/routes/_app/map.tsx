import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ReliefMap } from "@/components/relief-map";
import { useReliefStore } from "@/lib/store";

export const Route = createFileRoute("/_app/map")({ component: MapPage });

function MapPage() {
  const requirements = useReliefStore((s) => s.requirements);
  return (
    <div className="rn-enter">
      <PageHeader kicker="Kaveri Basin" title="Camp map" />
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Pins are colour-coded by the highest open AI Priority Score at that camp.
        Select a pin for the active requirement.
      </p>
      <ReliefMap requirements={requirements} />
    </div>
  );
}
