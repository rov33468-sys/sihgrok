import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PriorityBadge } from "@/components/priority-badge";
import { Button } from "@/components/ui/button";
import { RESOURCE_LABEL, type Requirement, type Role } from "@/lib/types";
import { cn, formatNumber, formatWhen } from "@/lib/utils";

export function RequirementCard({
  item,
  role,
  onContribute,
  compact,
}: {
  item: Requirement;
  role?: Role | null;
  onContribute?: (id: string) => void;
  compact?: boolean;
}) {
  const remaining = Math.max(0, item.quantityNeeded - item.quantityFulfilled);
  const pct = Math.min(
    100,
    Math.round((item.quantityFulfilled / Math.max(item.quantityNeeded, 1)) * 100),
  );

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
        "transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <PriorityBadge priority={item.priority} score={item.priorityScore} />
        <span className="text-[11px] text-subtle tabular">
          {formatWhen(item.createdAt)}
        </span>
      </div>

      <Link
        to="/feed/$id"
        params={{ id: item.id }}
        className="mt-3 block min-h-0"
      >
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {RESOURCE_LABEL[item.resourceType]} · {item.campName}
        </p>
        <h3 className="mt-1 text-base font-semibold leading-snug tracking-tight">
          {item.title}
        </h3>
      </Link>

      {!compact ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted">{item.notes}</p>
      ) : null}

      <div
        className={cn(
          "mt-4 grid gap-3",
          compact ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        <Stat k="People" v={formatNumber(item.peopleAffected)} />
        <Stat
          k="Needed"
          v={`${formatNumber(remaining)}`}
          sub={item.quantityUnit}
        />
        {!compact ? <Stat k="Duration" v={`${item.durationDays}d`} /> : null}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px] text-muted">
          <span>Fulfilled</span>
          <span className="tabular">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full",
              item.priority === "critical" && "bg-critical",
              item.priority === "high" && "bg-high",
              item.priority === "moderate" && "bg-moderate",
              item.priority === "low" && "bg-low",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{item.location}</span>
        </p>
        {role === "donor" && remaining > 0 ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onContribute?.(item.id)}
          >
            Contribute
          </Button>
        ) : (
          <Button size="sm" variant="ghost" asChild>
            <Link to="/feed/$id" params={{ id: item.id }}>
              Details
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function Stat({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-subtle uppercase">{k}</p>
      <p className="font-mono text-xl font-semibold leading-tight tracking-tight tabular">
        {v}
        {sub ? (
          <span className="ml-1 font-sans text-[11px] font-medium text-muted">
            {sub}
          </span>
        ) : null}
      </p>
    </div>
  );
}
