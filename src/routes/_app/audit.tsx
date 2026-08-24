import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StageBadge, VerifyBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { useReliefStore } from "@/lib/store";
import { STAGE_LABEL } from "@/lib/types";
import { formatStamp } from "@/lib/utils";

export const Route = createFileRoute("/_app/audit")({ component: AuditPage });

function AuditPage() {
  const transactions = useReliefStore((s) =>
    s.transactions.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  );

  return (
    <div className="rn-enter">
      <PageHeader
        kicker="Transparency"
        title="Audit trail"
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Full chain for every transfer: donor, coordinator, receiver, proofs, and
        verification. Anyone on the network can inspect a record.
      </p>
      <div className="space-y-4">
        {transactions.map((t) => (
          <article
            key={t.id}
            className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-subtle">{t.id}</span>
              <StageBadge stage={t.stage} />
              {t.disputed ? <Badge tone="critical">Disputed</Badge> : null}
            </div>
            <h2 className="mt-2 text-base font-semibold">
              <Link
                to="/transactions/$id"
                params={{ id: t.id }}
                className="hover:underline"
              >
                {t.donorName} → {t.coordinatorName ?? "unassigned"} → {t.campName}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t.quantity} {t.quantityUnit} · declared {t.declaredAmount}
            </p>
            <ol className="mt-4 space-y-1.5 border-l border-border pl-4 text-sm">
              {t.stageHistory.map((h, i) => (
                <li key={`${h.stage}-${i}`} className="text-muted">
                  <span className="font-medium text-fg">{STAGE_LABEL[h.stage]}</span>
                  {" · "}
                  {h.by} · {formatStamp(h.at)}
                </li>
              ))}
            </ol>
            {t.proofs.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {t.proofs.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-full bg-bg px-3 py-1 text-xs"
                  >
                    <span className="truncate">{p.fileName}</span>
                    <VerifyBadge status={p.verification} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-subtle">No proof attached.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
