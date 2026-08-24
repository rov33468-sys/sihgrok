import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ContributeDialog } from "@/components/contribute-dialog";
import { PriorityBadge } from "@/components/priority-badge";
import { StageBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useReliefStore } from "@/lib/store";
import { RESOURCE_LABEL } from "@/lib/types";
import { formatNumber, formatWhen } from "@/lib/utils";

export const Route = createFileRoute("/_app/feed/$id")({
  component: RequirementDetailPage,
});

function RequirementDetailPage() {
  const { id } = Route.useParams();
  const user = useReliefStore((s) => s.currentUser);
  const item = useReliefStore((s) => s.requirements.find((r) => r.id === id));
  const related = useReliefStore((s) =>
    s.transactions.filter((t) => t.requirementId === id),
  );
  const [open, setOpen] = useState(false);

  if (!item) {
    return (
      <p className="text-sm text-muted">
        Requirement not found.{" "}
        <Link to="/feed" className="text-fg underline">
          Back to feed
        </Link>
      </p>
    );
  }

  const remaining = Math.max(0, item.quantityNeeded - item.quantityFulfilled);
  const b = item.scoreBreakdown;

  return (
    <div className="rn-enter mx-auto max-w-3xl">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
        {item.campName} · {item.location}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={item.priority} score={item.priorityScore} />
        <span className="text-xs text-subtle">{formatWhen(item.createdAt)}</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{item.title}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">{item.notes}</p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric k="People" v={formatNumber(item.peopleAffected)} />
        <Metric
          k="Still needed"
          v={formatNumber(remaining)}
          sub={item.quantityUnit}
        />
        <Metric k="Duration" v={`${item.durationDays} days`} />
        <Metric k="Resource" v={RESOURCE_LABEL[item.resourceType]} />
      </dl>

      <section className="mt-8 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">AI Priority Score</h2>
        <p className="mt-1 text-xs text-muted">
          Rule-based prototype — not a trained model. Weighted from people at
          risk, unfilled gap, time pressure, and stated urgency.
        </p>
        <p className="mt-4 font-mono text-4xl font-semibold tabular">
          {item.priorityScore}
          <span className="ml-2 font-sans text-sm font-medium text-muted">
            / 100 · {item.priority}
          </span>
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <ScorePart k="People" v={b.people} />
          <ScorePart k="Resource gap" v={b.gap} />
          <ScorePart k="Time" v={b.time} />
          <ScorePart k="Urgency" v={b.urgency} />
        </ul>
      </section>

      {user?.role === "donor" && remaining > 0 ? (
        <div className="mt-6">
          <Button variant="primary" onClick={() => setOpen(true)}>
            Contribute {item.quantityUnit}
          </Button>
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Linked transfers</h2>
        {related.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No contributions yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {related.map((t) => (
              <li key={t.id}>
                <Link
                  to="/transactions/$id"
                  params={{ id: t.id }}
                  className="flex min-h-14 items-center justify-between gap-3 px-4 text-sm"
                >
                  <span>
                    {t.donorName} · {t.quantity} {t.quantityUnit}
                  </span>
                  <StageBadge stage={t.stage} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ContributeDialog
        requirementId={item.id}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function Metric({
  k,
  v,
  sub,
}: {
  k: string;
  v: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <dt className="text-[11px] tracking-wide text-subtle uppercase">{k}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tracking-tight tabular">
        {v}
        {sub ? (
          <span className="ml-1 font-sans text-xs font-medium text-muted">
            {sub}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function ScorePart({ k, v }: { k: string; v: number }) {
  return (
    <li className="rounded-lg bg-bg px-3 py-2">
      <p className="text-[11px] text-subtle">{k}</p>
      <p className="font-mono text-lg font-semibold tabular">{v}</p>
    </li>
  );
}
