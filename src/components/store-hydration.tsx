import { useEffect } from "react";
import { useReliefStore } from "@/lib/store";

export function StoreHydration() {
  const fieldMode = useReliefStore((s) => s.fieldMode);
  const setHydrated = useReliefStore((s) => s.setHydrated);

  useEffect(() => {
    const unsub = useReliefStore.persist.onFinishHydration(() => {
      setHydrated();
      void useReliefStore.getState().syncFromDb();
    });
    void useReliefStore.persist.rehydrate();
    if (useReliefStore.persist.hasHydrated()) {
      setHydrated();
      void useReliefStore.getState().syncFromDb();
    }
    return unsub;
  }, [setHydrated]);

  useEffect(() => {
    document.documentElement.dataset.mode = fieldMode ? "field" : "default";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", fieldMode ? "#0C0C0B" : "#F3F1EC");
  }, [fieldMode]);

  return null;
}

export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg text-fg">
      <span className="grid size-10 grid-cols-2 gap-1" aria-hidden>
        <span className="bg-fg" />
        <span className="bg-fg" />
        <span className="bg-fg" />
        <span className="bg-accent" />
      </span>
      <p className="mt-4 text-xs font-semibold tracking-[0.2em]">RELIETNET</p>
    </div>
  );
}
