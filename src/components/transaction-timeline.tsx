import { Check } from "lucide-react";
import { STAGE_LABEL, STAGE_ORDER, type StageEvent, type TxStage } from "@/lib/types";
import { cn, formatStamp } from "@/lib/utils";

export function TransactionTimeline({
  current,
  history,
}: {
  current: TxStage;
  history: StageEvent[];
}) {
  const currentIndex = STAGE_ORDER.indexOf(current);
  const stampFor = (stage: TxStage) =>
    history.find((h) => h.stage === stage);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {STAGE_ORDER.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const event = stampFor(stage);
        return (
          <li
            key={stage}
            className="flex sm:flex-1 sm:flex-col"
          >
            <div className="flex flex-col items-center sm:flex-row sm:items-center sm:w-full">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  done && "bg-delivered text-accent-fg",
                  active && "bg-fg text-bg",
                  !done && !active && "bg-surface-2 text-subtle",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              {i < STAGE_ORDER.length - 1 ? (
                <span
                  className={cn(
                    "w-px flex-1 sm:h-px sm:w-auto",
                    done ? "bg-delivered" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <div className="min-w-0 pb-4 pl-3 sm:pt-2 sm:pl-0 sm:pr-3">
              <p
                className={cn(
                  "text-xs font-medium leading-snug",
                  active ? "text-fg" : "text-muted",
                )}
              >
                {STAGE_LABEL[stage]}
              </p>
              {event ? (
                <p className="mt-0.5 text-[11px] text-subtle tabular">
                  {formatStamp(event.at)}
                  <span className="block truncate">{event.by}</span>
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] text-subtle">—</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
