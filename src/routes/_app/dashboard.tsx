import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ContributeDialog } from "@/components/contribute-dialog";
import { PriorityBadge } from "@/components/priority-badge";
import { RequirementCard } from "@/components/requirement-card";
import { StageBadge } from "@/components/status-badge";
import { Bento, BentoCell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useReliefStore } from "@/lib/store";
import {
  PRIORITY_ORDER,
  RESOURCE_LABEL,
  type Requirement,
  type Transaction,
} from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useReliefStore((s) => s.currentUser);
  if (!user) return null;
  if (user.role === "donor") return <DonorHome />;
  if (user.role === "receiver") return <ReceiverHome />;
  return <CoordinatorHome />;
}

function DonorHome() {
  const user = useReliefStore((s) => s.currentUser)!;
  const requirements = useReliefStore((s) => s.requirements);
  const transactions = useReliefStore((s) => s.transactions);
  const contribute = useReliefStore((s) => s.contribute);
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  const feed = useMemo(
    () =>
      requirements
        .filter((r) => r.status !== "fulfilled")
        .slice()
        .sort(
          (a, b) =>
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
            b.priorityScore - a.priorityScore,
        ),
    [requirements],
  );
  const mine = transactions.filter((t) => t.donorId === user.id);
  const people = mine.reduce((a, t) => {
    const r = requirements.find((x) => x.id === t.requirementId);
    return a + (r ? Math.round(r.peopleAffected * (t.quantity / r.quantityNeeded)) : 0);
  }, 0);
  const top = feed[0];

  const quickDonate = () => {
    if (!top) return;
    const remaining = Math.max(1, top.quantityNeeded - top.quantityFulfilled);
    const qty = Math.max(1, Math.round(remaining * 0.2));
    const tx = contribute(top.id, qty, "Quick donate from dashboard");
    toast.success(`Committed ${tx.quantity} ${tx.quantityUnit} to ${top.campName}.`);
    navigate({ to: "/transactions/$id", params: { id: tx.id } });
  };

  return (
    <div className="rn-enter">
      <PageHeader
        kicker={`Donor · ${user.name}`}
        title="Where help is needed"
        action={
          <Button variant="primary" onClick={quickDonate} disabled={!top}>
            Quick donate
          </Button>
        }
      />
      <Bento>
        <BentoCell
          label="Open critical"
          value={feed.filter((r) => r.priority === "critical").length}
          tone="critical"
        />
        <BentoCell label="My transfers" value={mine.length} />
        <BentoCell
          label="People reached"
          value={formatNumber(people)}
          hint="Estimated from share of each request"
        />
        <BentoCell
          label="Preferred"
          value={user.contributionType ? RESOURCE_LABEL[user.contributionType] : "Any"}
        />
      </Bento>
      <section className="mt-8">
        <SectionTitle
          title="Priority feed"
          to="/feed"
          link="Open feed"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {feed.slice(0, 4).map((item) => (
            <RequirementCard
              key={item.id}
              item={item}
              role="donor"
              onContribute={setOpenId}
            />
          ))}
        </div>
      </section>
      <section className="mt-8">
        <SectionTitle title="My contributions" to="/transactions" link="All transfers" />
        <TransferList items={mine} empty="No contributions yet. Open the feed to commit." />
      </section>
      <ContributeDialog
        requirementId={openId}
        open={!!openId}
        onOpenChange={(v) => !v && setOpenId(null)}
      />
    </div>
  );
}

function ReceiverHome() {
  const user = useReliefStore((s) => s.currentUser)!;
  const requirements = useReliefStore((s) =>
    s.requirements.filter((r) => r.receiverId === user.id),
  );
  const surplus = useReliefStore((s) =>
    s.surplus.filter((x) => x.receiverId === user.id),
  );
  const inbound = useReliefStore((s) =>
    s.transactions.filter((t) => t.receiverId === user.id),
  );

  return (
    <div className="rn-enter">
      <PageHeader
        kicker={user.orgName || "Receiver"}
        title="Camp operations"
        action={
          <Button variant="primary" asChild>
            <Link to="/post">Post a requirement</Link>
          </Button>
        }
      />
      <Bento>
        <BentoCell label="Active requests" value={requirements.filter((r) => r.status !== "fulfilled").length} />
        <BentoCell
          label="People listed"
          value={formatNumber(requirements.reduce((a, r) => a + r.peopleAffected, 0))}
        />
        <BentoCell label="Inbound transfers" value={inbound.length} />
        <BentoCell label="Surplus posts" value={surplus.length} />
      </Bento>
      <section className="mt-8">
        <SectionTitle title="My requests" to="/feed" />
        {requirements.length === 0 ? (
          <Empty>No requests yet. Post what the camp needs.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {requirements.map((item) => (
              <RequirementCard key={item.id} item={item} role="receiver" />
            ))}
          </div>
        )}
      </section>
      <section className="mt-8">
        <SectionTitle title="Incoming" to="/transactions" />
        <TransferList items={inbound} empty="No inbound transfers yet." />
      </section>
      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link to="/surplus">Post surplus</Link>
        </Button>
      </div>
    </div>
  );
}

function CoordinatorHome() {
  const requirements = useReliefStore((s) => s.requirements);
  const surplus = useReliefStore((s) => s.surplus);
  const transactions = useReliefStore((s) => s.transactions);
  const matchSurplus = useReliefStore((s) => s.matchSurplus);
  const navigate = useNavigate();

  const pending = transactions.filter(
    (t) => t.stage === "pending" || t.stage === "donated",
  );
  const active = transactions.filter(
    (t) =>
      t.stage === "received_by_coordinator" || t.stage === "in_transit",
  );
  const flagged = transactions.filter((t) => t.disputed);
  const available = surplus.filter((s) => s.status === "available" && s.quantity > 0);

  const suggestions = available.flatMap((s) => {
    const need = requirements
      .filter(
        (r) =>
          r.resourceType === s.resourceType &&
          r.status !== "fulfilled" &&
          r.receiverId !== s.receiverId,
      )
      .sort((a, b) => b.priorityScore - a.priorityScore)[0];
    return need ? [{ surplus: s, need }] : [];
  });

  return (
    <div className="rn-enter">
      <PageHeader kicker="Coordinator" title="Basin overview" />
      <Bento>
        <BentoCell
          label="Pending matches"
          value={pending.length}
          hint="Donated, awaiting intake"
        />
        <BentoCell label="Active deliveries" value={active.length} />
        <BentoCell
          label="Flagged"
          value={flagged.length}
          tone={flagged.length ? "critical" : "default"}
          hint="Quantity mismatch"
        />
        <BentoCell label="Surplus queue" value={available.length} />
      </Bento>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-semibold">Surplus → need</h2>
          <p className="mt-1 text-xs text-muted">
            Match idle stock at one camp to a high-need camp of the same resource.
          </p>
          <ul className="mt-4 space-y-3">
            {suggestions.length === 0 ? (
              <li className="text-sm text-muted">No compatible surplus right now.</li>
            ) : (
              suggestions.map(({ surplus: s, need }) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 rounded-lg bg-bg p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {s.campName} → {need.campName}
                    </p>
                    <p className="text-xs text-muted">
                      {s.quantity} {s.quantityUnit} {RESOURCE_LABEL[s.resourceType].toLowerCase()}{" "}
                      · need score {need.priorityScore}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const tx = matchSurplus(s.id, need.id);
                      if (tx)
                        navigate({
                          to: "/transactions/$id",
                          params: { id: tx.id },
                        });
                    }}
                  >
                    Match & transfer
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-semibold">Flagged transactions</h2>
          {flagged.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No disputes in the queue.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {flagged.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/transactions/$id"
                    params={{ id: t.id }}
                    className="flex min-h-12 items-center justify-between gap-2 rounded-lg bg-bg px-3 text-sm"
                  >
                    <span className="truncate">
                      {t.donorName} → {t.campName}
                    </span>
                    <PriorityBadge
                      priority={
                        requirements.find((r) => r.id === t.requirementId)
                          ?.priority ?? "moderate"
                      }
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="mt-8">
        <SectionTitle title="Open requirements" to="/feed" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {requirements
            .filter((r) => r.status !== "fulfilled")
            .slice()
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .slice(0, 3)
            .map((item: Requirement) => (
              <RequirementCard key={item.id} item={item} role="coordinator" compact />
            ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({
  title,
  to,
  link,
}: {
  title: string;
  to?: "/feed" | "/transactions";
  link?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {to ? (
        <Link to={to} className="text-xs font-medium text-muted hover:text-fg">
          {link ?? "View all"}
        </Link>
      ) : null}
    </div>
  );
}

function TransferList({
  items,
  empty,
}: {
  items: Transaction[];
  empty: string;
}) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
      {items.slice(0, 5).map((t) => (
        <li key={t.id}>
          <Link
            to="/transactions/$id"
            params={{ id: t.id }}
            className="flex min-h-14 items-center justify-between gap-3 px-4 text-sm"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {t.quantity} {t.quantityUnit} · {t.campName}
              </span>
              <span className="text-xs text-muted">{t.donorName}</span>
            </span>
            <StageBadge stage={t.stage} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
      {children}
    </p>
  );
}
