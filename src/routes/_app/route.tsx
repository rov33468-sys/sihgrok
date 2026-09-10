import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Splash } from "@/components/store-hydration";
import { useReliefStore } from "@/lib/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/_app")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const hydrated = useReliefStore((s) => s._hydrated);
  const user = useReliefStore((s) => s.currentUser);
  const { user: authedUser, isPending: authPending } = useCurrentUserState();

  if (!hydrated || authPending) return <Splash />;
  if (!authedUser || !user) return <Navigate to="/" />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
