import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { ProofUpload } from "@/components/proof-upload";
import { StageBadge, VerifyBadge } from "@/components/status-badge";
import { TransactionTimeline } from "@/components/transaction-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReliefStore } from "@/lib/store";
import {
  RESOURCE_LABEL,
  STAGE_LABEL,
  nextStage,
  type Role,
  type TxStage,
} from "@/lib/types";
import { formatNumber, formatStamp } from "@/lib/utils";

export const Route = createFileRoute("/_app/transactions/$id")({
  component: TransactionDetailPage,
});

function canAdvance(role: Role, stage: TxStage): TxStage | null {
  const nxt = nextStage(stage);
  if (!nxt) return null;
  if (role === "coordinator") return nxt;
  if (role === "receiver" && (stage === "in_transit" || stage === "delivered"))
    return nxt;
  return null;
}

function TransactionDetailPage() {
  const { id } = Route.useParams();
  const user = useReliefStore((s) => s.currentUser);
  const tx = useReliefStore((s) => s.transactions.find((t) => t.id === id));
  const req = useReliefStore((s) =>
    s.requirements.find((r) => r.id === tx?.requirementId),
  );
  const advanceStage = useReliefStore((s) => s.advanceStage);
  const resolveDispute = useReliefStore((s) => s.resolveDispute);

  if (!tx) {
    return (
      <p className="text-sm text-muted">
        Transfer not found.{" "}
        <Link to="/transactions" className="text-fg underline">
          Back
        </Link>
      </p>
    );
  }

  const nxt = user ? canAdvance(user.role, tx.stage) : null;

  return (
    <div className="rn-enter mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <StageBadge stage={tx.stage} />
        {tx.disputed ? <Badge tone="critical">Disputed</Badge> : null}
        {tx.kind === "redistribution" ? (
          <Badge tone="transit">Redistribution</Badge>
        ) : null}
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {tx.donorName} → {tx.campName}
      </h1>
      <p className="mt-2 text-muted">
        {formatNumber(tx.quantity)} {tx.quantityUnit} of{" "}
        {RESOURCE_LABEL[tx.resourceType].toLowerCase()}
        {req ? (
          <>
            {" "}
            for{" "}
            <Link
              to="/feed/$id"
              params={{ id: req.id }}
              className="text-fg underline-offset-2 hover:underline"
            >
              {req.title}
            </Link>
          </>
        ) : null}
      </p>

      <section className="mt-8 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h2 className="mb-4 text-sm font-semibold">Status timeline</h2>
        <TransactionTimeline current={tx.stage} history={tx.stageHistory} />
      </section>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <Row k="Donor" v={tx.donorName} />
        <Row k="Coordinator" v={tx.coordinatorName ?? "Unassigned"} />
        <Row k="Receiver" v={`${tx.receiverName} · ${tx.campName}`} />
        <Row k="Declared qty" v={`${tx.declaredAmount} ${tx.quantityUnit}`} />
      </dl>

      {tx.notes ? (
        <p className="mt-4 text-sm text-muted">{tx.notes}</p>
      ) : null}

      {tx.disputed ? (
        <div className="mt-6 rounded-xl bg-critical/10 p-4">
          <p className="text-sm font-semibold text-critical">Disputed</p>
          <p className="mt-1 text-sm text-muted">{tx.disputeReason}</p>
          {user?.role === "coordinator" ? (
            <Button
              className="mt-3"
              size="sm"
              onClick={() => {
                resolveDispute(tx.id);
                toast.success("Dispute marked resolved.");
              }}
            >
              Resolve as verified
            </Button>
          ) : null}
        </div>
      ) : null}

      {nxt ? (
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={() => {
              advanceStage(tx.id);
              toast.success(`Moved to ${STAGE_LABEL[nxt]}.`);
            }}
          >
            Mark {STAGE_LABEL[nxt].toLowerCase()}
          </Button>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Proofs</h2>
        {tx.proofs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tx.proofs.map((p) => (
              <li
                key={p.id}
                className="flex items-start gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]"
              >
                {p.dataUrl && p.mimeType.startsWith("image/") ? (
                  <img
                    src={p.dataUrl}
                    alt=""
                    className="size-14 rounded-md object-cover outline outline-1 -outline-offset-1 outline-fg/10"
                  />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-md bg-surface-2">
                    <FileText className="size-5 text-muted" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.fileName}</p>
                  <p className="text-xs text-muted">
                    {p.uploaderName} · {p.kind.replace("_", " ")} · qty{" "}
                    {p.amountEntered} · {formatStamp(p.uploadedAt)}
                  </p>
                  <div className="mt-1">
                    <VerifyBadge status={p.verification} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6">
        <ProofUpload txId={tx.id} />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
      <dt className="text-[11px] tracking-wide text-subtle uppercase">{k}</dt>
      <dd className="mt-1 font-medium">{v}</dd>
    </div>
  );
}
