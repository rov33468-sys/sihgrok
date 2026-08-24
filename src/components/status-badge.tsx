import { Badge } from "@/components/ui/badge";
import { STAGE_LABEL, type TxStage, type VerificationStatus } from "@/lib/types";

export function StageBadge({ stage }: { stage: TxStage }) {
  const tone =
    stage === "confirmed" || stage === "delivered"
      ? "delivered"
      : stage === "in_transit" || stage === "received_by_coordinator"
        ? "transit"
        : stage === "donated"
          ? "ink"
          : "pending";
  return <Badge tone={tone}>{STAGE_LABEL[stage]}</Badge>;
}

export function VerifyBadge({ status }: { status: VerificationStatus }) {
  if (status === "verified") return <Badge tone="delivered">Verified</Badge>;
  if (status === "mismatch_flagged")
    return <Badge tone="critical">Mismatch flagged</Badge>;
  return <Badge tone="pending">Pending review</Badge>;
}
