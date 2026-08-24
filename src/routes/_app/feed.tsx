import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ContributeDialog } from "@/components/contribute-dialog";
import { PageHeader } from "@/components/app-shell";
import { RequirementCard } from "@/components/requirement-card";
import { useReliefStore } from "@/lib/store";
import {
  PRIORITY_ORDER,
  RESOURCE_LABEL,
  type Priority,
  type ResourceType,
} from "@/lib/types";
import { cn, selectClass } from "@/lib/utils";

export const Route = createFileRoute("/_app/feed")({ component: FeedPage });

const PRIORITIES: Array<Priority | "all"> = [
  "all",
  "critical",
  "high",
  "moderate",
  "low",
];

function FeedPage() {
  const user = useReliefStore((s) => s.currentUser);
  const requirements = useReliefStore((s) => s.requirements);
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [resource, setResource] = useState<ResourceType | "all">("all");
  const [location, setLocation] = useState<string>("all");
  const [sort, setSort] = useState<"priority" | "people" | "newest">("priority");
  const [openId, setOpenId] = useState<string | null>(null);

  const locations = useMemo(
    () => [...new Set(requirements.map((r) => r.location))],
    [requirements],
  );

  const items = useMemo(() => {
    let list = requirements.slice();
    if (priority !== "all") list = list.filter((r) => r.priority === priority);
    if (resource !== "all")
      list = list.filter((r) => r.resourceType === resource);
    if (location !== "all") list = list.filter((r) => r.location === location);
    list.sort((a, b) => {
      if (sort === "people") return b.peopleAffected - a.peopleAffected;
      if (sort === "newest")
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      return (
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        b.priorityScore - a.priorityScore
      );
    });
    return list;
  }, [requirements, priority, resource, location, sort]);

  return (
    <div className="rn-enter">
      <PageHeader
        kicker="Open relief feed"
        title="Requirements"
      />
      <div className="mb-5 flex flex-col gap-3">
        <ChipRow>
          {PRIORITIES.map((p) => (
            <Chip
              key={p}
              on={priority === p}
              tone={p === "all" ? undefined : p}
              onClick={() => setPriority(p)}
            >
              {p === "all" ? "All priority" : p}
            </Chip>
          ))}
        </ChipRow>
        <div className="flex flex-wrap gap-2">
          <select
            value={resource}
            onChange={(e) =>
              setResource(e.target.value as ResourceType | "all")
            }
            className={cn(selectClass, "w-auto bg-surface")}
          >
            <option value="all">All resources</option>
            {(Object.keys(RESOURCE_LABEL) as ResourceType[]).map((k) => (
              <option key={k} value={k}>
                {RESOURCE_LABEL[k]}
              </option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={cn(selectClass, "w-auto bg-surface")}
          >
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as "priority" | "people" | "newest")
            }
            className={cn(selectClass, "w-auto bg-surface")}
          >
            <option value="priority">Sort: priority</option>
            <option value="people">Sort: people affected</option>
            <option value="newest">Sort: newest</option>
          </select>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[var(--shadow-border)]">
          No posts match these filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <RequirementCard
              key={item.id}
              item={item}
              role={user?.role}
              onContribute={setOpenId}
            />
          ))}
        </div>
      )}
      <ContributeDialog
        requirementId={openId}
        open={!!openId}
        onOpenChange={(v) => !v && setOpenId(null)}
      />
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-[var(--space-page)] flex gap-2 overflow-x-auto px-[var(--space-page)] pb-1">
      {children}
    </div>
  );
}

function Chip({
  on,
  onClick,
  tone,
  children,
}: {
  on: boolean;
  onClick: () => void;
  tone?: Priority;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-full px-3 text-xs font-semibold capitalize",
        on && !tone && "bg-fg text-bg",
        on && tone === "critical" && "bg-critical text-accent-fg",
        on && tone === "high" && "bg-high text-accent-fg",
        on && tone === "moderate" && "bg-moderate text-accent-fg",
        on && tone === "low" && "bg-low text-accent-fg",
        !on && "bg-surface text-muted shadow-[var(--shadow-border)]",
      )}
    >
      {children}
    </button>
  );
}
