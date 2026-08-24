import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PriorityBadge } from "@/components/priority-badge";
import { RESOURCE_LABEL, type Priority, type Requirement } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

const PRIORITY_FILL: Record<Priority, string> = {
  critical: "var(--rn-critical)",
  high: "var(--rn-high)",
  moderate: "var(--rn-moderate)",
  low: "var(--rn-low)",
};

export function ReliefMap({
  requirements,
}: {
  requirements: Requirement[];
}) {
  const camps = useMemo(() => {
    const map = new Map<
      string,
      { name: string; x: number; y: number; items: Requirement[] }
    >();
    for (const r of requirements) {
      const key = r.campName;
      const cur = map.get(key);
      if (cur) cur.items.push(r);
      else
        map.set(key, {
          name: r.campName,
          x: r.mapX,
          y: r.mapY,
          items: [r],
        });
    }
    return [...map.values()];
  }, [requirements]);

  const [active, setActive] = useState<string | null>(camps[0]?.name ?? null);
  const selected = camps.find((c) => c.name === active);
  const top = selected?.items
    .slice()
    .sort((a, b) => b.priorityScore - a.priorityScore)[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <p className="pointer-events-none absolute top-3 left-3 z-10 rounded-md bg-surface/90 px-2 py-1 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
          Kaveri Basin
        </p>
        <svg
          viewBox="0 0 800 520"
          className="block h-auto w-full"
          role="img"
          aria-label="Kaveri Basin relief map"
        >
          <rect width="800" height="520" fill="var(--rn-surface-2)" />
          <path
            d="M-20 80 C 120 40, 200 120, 280 90 C 400 50, 460 160, 580 120 C 700 80, 820 140, 840 110 L 840 0 L -20 0 Z"
            fill="var(--rn-bg)"
            opacity="0.7"
          />
          <path
            d="M-10 200 C 80 240, 140 180, 220 220 C 320 270, 380 210, 500 260 C 620 310, 700 250, 820 300 L 820 540 L -10 540 Z"
            fill="var(--rn-bg)"
            opacity="0.55"
          />
          <path
            d="M40 0 C 90 80, 70 160, 120 240 C 170 330, 130 400, 190 520"
            fill="none"
            stroke="var(--rn-transit)"
            strokeWidth="18"
            opacity="0.35"
          />
          <path
            d="M40 0 C 90 80, 70 160, 120 240 C 170 330, 130 400, 190 520"
            fill="none"
            stroke="var(--rn-transit)"
            strokeWidth="6"
            opacity="0.7"
          />
          <path
            d="M0 310 H 800"
            stroke="var(--rn-fg)"
            strokeOpacity="0.08"
            strokeWidth="2"
          />
          <path
            d="M310 0 V 520"
            stroke="var(--rn-fg)"
            strokeOpacity="0.08"
            strokeWidth="2"
          />
        </svg>
        {camps.map((camp) => {
          const lead = camp.items
            .slice()
            .sort((a, b) => b.priorityScore - a.priorityScore)[0];
          const isOn = active === camp.name;
          return (
            <button
              key={camp.name}
              type="button"
              onClick={() => setActive(camp.name)}
              className={cn(
                "absolute z-[1] flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
                "shadow-[var(--shadow-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isOn && "z-[2]",
              )}
              style={{
                left: `${12 + camp.x * 0.76}%`,
                top: `${16 + camp.y * 0.68}%`,
                background: PRIORITY_FILL[lead?.priority ?? "low"],
                color: "var(--rn-accent-fg)",
                transform: isOn
                  ? "translate(-50%, -50%) scale(1.12)"
                  : "translate(-50%, -50%)",
              }}
              aria-label={`${camp.name}, ${lead?.priority ?? "low"} priority`}
            >
              <span className="font-mono text-[11px] font-bold">
                {camp.name.replace("Camp ", "").slice(0, 2).toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      <aside className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        {selected && top ? (
          <>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              {selected.name}
            </p>
            <div className="mt-2">
              <PriorityBadge priority={top.priority} score={top.priorityScore} />
            </div>
            <h3 className="mt-3 text-base font-semibold leading-snug">
              {top.title}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {RESOURCE_LABEL[top.resourceType]} ·{" "}
              {formatNumber(top.peopleAffected)} people
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {selected.items.map((r) => (
                <li key={r.id} className="flex justify-between gap-2 text-muted">
                  <span className="truncate">{RESOURCE_LABEL[r.resourceType]}</span>
                  <span className="tabular text-fg">
                    {formatNumber(r.quantityNeeded - r.quantityFulfilled)}{" "}
                    {r.quantityUnit}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/feed/$id"
              params={{ id: top.id }}
              className="mt-4 inline-flex h-11 items-center text-sm font-medium text-accent"
            >
              Open requirement
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted">Select a camp pin.</p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2 text-[11px] text-muted">
          <Legend c="var(--rn-critical)" l="Critical" />
          <Legend c="var(--rn-high)" l="High" />
          <Legend c="var(--rn-moderate)" l="Moderate" />
          <Legend c="var(--rn-low)" l="Low" />
        </div>
      </aside>
    </div>
  );
}

function Legend({ c, l }: { c: string; l: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: c }} />
      {l}
    </span>
  );
}
