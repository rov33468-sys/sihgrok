import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/lib/types";

const TONE: Record<Priority, "critical" | "high" | "moderate" | "low"> = {
  critical: "critical",
  high: "high",
  moderate: "moderate",
  low: "low",
};

const LABEL: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export function PriorityBadge({
  priority,
  score,
}: {
  priority: Priority;
  score?: number;
}) {
  return (
    <Badge tone={TONE[priority]} className="gap-1.5">
      {LABEL[priority]}
      {typeof score === "number" ? (
        <span className="tabular font-mono font-semibold opacity-80">
          {score}
        </span>
      ) : null}
    </Badge>
  );
}
