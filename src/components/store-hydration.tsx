import { useEffect } from "react";
import { useReliefStore } from "@/lib/store";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  subscribeToUsers,
  subscribeToRequirements,
  subscribeToSurplus,
  subscribeToTransactions,
  seedFirestoreIfEmpty,
} from "@/lib/firebase/db";

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

  // Real-time Firestore synchronization
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    void seedFirestoreIfEmpty();

    const unsubs = [
      subscribeToUsers((users) => {
        if (users.length > 0) useReliefStore.setState({ users });
      }),
      subscribeToRequirements((requirements) => {
        if (requirements.length > 0) useReliefStore.setState({ requirements });
      }),
      subscribeToSurplus((surplus) => {
        if (surplus.length > 0) useReliefStore.setState({ surplus });
      }),
      subscribeToTransactions((transactions) => {
        if (transactions.length > 0) useReliefStore.setState({ transactions });
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

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
