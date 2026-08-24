import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-surface-2 shadow-[var(--shadow-border)] transition-colors",
        "data-[state=checked]:bg-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-surface shadow-sm transition-transform",
          "data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-1",
          "data-[state=checked]:bg-bg",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
