import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
  {
    variants: {
      tone: {
        critical: "bg-critical/12 text-critical",
        high: "bg-high/12 text-high",
        moderate: "bg-moderate/15 text-moderate",
        low: "bg-low/12 text-low",
        pending: "bg-pending/12 text-pending",
        transit: "bg-transit/12 text-transit",
        delivered: "bg-delivered/12 text-delivered",
        muted: "bg-surface-2 text-muted",
        ink: "bg-fg text-bg",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}
