import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { StageBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { useReliefStore } from "@/lib/store";
import { RESOURCE_LABEL } from "@/lib/types";
import { formatWhen } from "@/lib/utils";

export const Route = createFileRoute("/_app/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const user = useReliefStore((s) => s.currentUser);
  const all = useReliefStore((s) => s.transactions);
  const list =
    user?.role === "coordinator"
      ? all
      : all.filter(
          (t) =>
            t.donorId === user?.id ||
            t.receiverId === user?.id ||
            t.coordinatorId === user?.id,
        );

  return (
    <div className="rn-enter">
      <PageHeader kicker="Pipeline" title="Transfers" />
      {list.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
          No transfers yet.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {list.map((t) => (
            <li key={t.id}>
              <Link
                to="/transactions/$id"
                params={{ id: t.id }}
                className="flex min-h-16 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.donorName} → {t.campName}
                  </p>
                  <p className="text-xs text-muted">
                    {t.quantity} {t.quantityUnit} {RESOURCE_LABEL[t.resourceType].toLowerCase()}{" "}
                    · {formatWhen(t.createdAt)}
                    {t.kind === "redistribution" ? " · redistribution" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {t.disputed ? <Badge tone="critical">Disputed</Badge> : null}
                  <StageBadge stage={t.stage} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
