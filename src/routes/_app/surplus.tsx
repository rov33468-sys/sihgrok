import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { PriorityBadge } from "@/components/priority-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReliefStore } from "@/lib/store";
import {
  RESOURCE_LABEL,
  RESOURCE_UNIT,
  type ResourceType,
} from "@/lib/types";
import { formatNumber, formatWhen, selectClass } from "@/lib/utils";

export const Route = createFileRoute("/_app/surplus")({
  component: SurplusPage,
});

const RESOURCES = Object.keys(RESOURCE_LABEL) as ResourceType[];

function SurplusPage() {
  const user = useReliefStore((s) => s.currentUser);
  const surplus = useReliefStore((s) => s.surplus);
  const requirements = useReliefStore((s) => s.requirements);
  const postSurplus = useReliefStore((s) => s.postSurplus);
  const matchSurplus = useReliefStore((s) => s.matchSurplus);
  const navigate = useNavigate();

  const [resourceType, setResourceType] = useState<ResourceType>("food");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const available = surplus.filter((s) => s.status === "available" && s.quantity > 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(quantity);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a surplus quantity.");
      return;
    }
    postSurplus({ resourceType, quantity: n, notes });
    toast.success("Surplus listed for coordinators.");
    setQuantity("");
    setNotes("");
  };

  return (
    <div className="rn-enter">
      <PageHeader kicker="Redistribution" title="Surplus board" />
      {user?.role === "receiver" ? (
        <form
          onSubmit={submit}
          className="mb-8 grid gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="rt">Resource</Label>
            <select
              id="rt"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as ResourceType)}
              className={selectClass}
            >
              {RESOURCES.map((k) => (
                <option key={k} value={k}>
                  {RESOURCE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sq">Quantity ({RESOURCE_UNIT[resourceType]})</Label>
            <Input
              id="sq"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="sn">Note</Label>
            <Textarea
              id="sn"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condition, packing, pickup window"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary">
              List surplus
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {available.length === 0 ? (
          <p className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            No surplus listed.
          </p>
        ) : (
          available.map((s) => {
            const match = requirements
              .filter(
                (r) =>
                  r.resourceType === s.resourceType &&
                  r.status !== "fulfilled" &&
                  r.receiverId !== s.receiverId,
              )
              .sort((a, b) => b.priorityScore - a.priorityScore)[0];
            return (
              <article
                key={s.id}
                className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                      {s.campName} · {s.location}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      {formatNumber(s.quantity)} {s.quantityUnit}{" "}
                      {RESOURCE_LABEL[s.resourceType].toLowerCase()}
                    </h2>
                  </div>
                  <span className="text-[11px] text-subtle">
                    {formatWhen(s.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{s.notes}</p>
                {match ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-lg bg-bg p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-muted">Suggested high-need camp</p>
                      <p className="text-sm font-medium">
                        {match.campName} · {match.title}
                      </p>
                      <div className="mt-1">
                        <PriorityBadge
                          priority={match.priority}
                          score={match.priorityScore}
                        />
                      </div>
                    </div>
                    {user?.role === "coordinator" ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const tx = matchSurplus(s.id, match.id);
                          if (tx) {
                            toast.success("Transfer arranged.");
                            navigate({
                              to: "/transactions/$id",
                              params: { id: tx.id },
                            });
                          }
                        }}
                      >
                        Match & arrange transfer
                      </Button>
                    ) : (
                      <p className="text-xs text-subtle">
                        Coordinators arrange the transfer.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-subtle">
                    No open need of this type right now.
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
