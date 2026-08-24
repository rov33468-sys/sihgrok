import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  ClipboardList,
  Ellipsis,
  LayoutGrid,
  LogOut,
  Map as MapIcon,
  Plus,
  Radio,
  RotateCcw,
  Scale,
  ArrowLeftRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useReliefStore } from "@/lib/store";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type AppTo =
  | "/dashboard"
  | "/feed"
  | "/post"
  | "/surplus"
  | "/map"
  | "/transactions"
  | "/audit";

type NavItem = {
  to: AppTo;
  label: string;
  icon: typeof LayoutGrid;
  roles?: Role[];
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutGrid },
  { to: "/feed", label: "Feed", icon: Radio },
  { to: "/post", label: "Post", icon: Plus, roles: ["receiver"] },
  { to: "/surplus", label: "Surplus", icon: ArrowLeftRight },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/transactions", label: "Transfers", icon: ClipboardList },
  { to: "/audit", label: "Audit", icon: Scale },
];

const PRIMARY: Record<Role, AppTo[]> = {
  donor: ["/dashboard", "/feed", "/map", "/transactions"],
  receiver: ["/dashboard", "/feed", "/post", "/transactions"],
  coordinator: ["/dashboard", "/feed", "/surplus", "/transactions"],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useReliefStore((s) => s.currentUser);
  const fieldMode = useReliefStore((s) => s.fieldMode);
  const toggleFieldMode = useReliefStore((s) => s.toggleFieldMode);
  const logout = useReliefStore((s) => s.logout);
  const resetDemo = useReliefStore((s) => s.resetDemo);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);

  const items = NAV.filter(
    (n) => !n.roles || (user && n.roles.includes(user.role)),
  );
  const primaryTos = user ? PRIMARY[user.role] : PRIMARY.donor;
  const primary = primaryTos
    .map((to) => items.find((i) => i.to === to))
    .filter((x): x is NavItem => Boolean(x));
  const overflow = items.filter((i) => !primaryTos.includes(i.to));

  const signOut = () => {
    logout();
    navigate({ to: "/" });
  };

  const isOn = (to: AppTo) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-[var(--space-page)]">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="grid size-6 grid-cols-2 gap-0.5" aria-hidden>
              <span className="bg-fg" />
              <span className="bg-fg" />
              <span className="bg-fg" />
              <span className="bg-accent" />
            </span>
            <span className="text-sm tracking-[0.14em]">RELIETNET</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "inline-flex h-9 items-center rounded-md px-3 text-sm",
                  isOn(item.to)
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-muted">
              <span className="hidden sm:inline">Field mode</span>
              <Switch
                checked={fieldMode}
                onCheckedChange={() => toggleFieldMode()}
                aria-label="Field mode"
              />
            </label>
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="text-right">
                  <p className="text-xs font-medium leading-none">{user.name}</p>
                  <p className="mt-0.5 text-[11px] text-subtle">
                    {ROLE_LABEL[user.role]}
                    {user.orgName ? ` · ${user.orgName}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                  onClick={signOut}
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="h-0.5 bg-accent" />
      </header>

      <main className="mx-auto w-full max-w-6xl px-[var(--space-page)] pt-6 pb-28 lg:pb-12">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
        <ul className="mx-auto grid max-w-6xl grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon;
            const on = isOn(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                    on ? "text-fg" : "text-subtle",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                moreOpen ? "text-fg" : "text-subtle",
              )}
            >
              <Ellipsis className="size-4" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user?.name ?? "Menu"}</DialogTitle>
            <DialogDescription>
              {user
                ? `${ROLE_LABEL[user.role]}${user.orgName ? ` · ${user.orgName}` : ""}${user.region ? ` · ${user.region}` : ""}`
                : "Navigation"}
            </DialogDescription>
          </DialogHeader>
          <nav className="grid gap-1">
            {overflow.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm",
                    isOn(item.to) ? "bg-surface-2 font-medium" : "hover:bg-bg",
                  )}
                >
                  <Icon className="size-4 text-muted" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-2 grid gap-2 border-t border-border pt-3">
            <label className="flex min-h-12 items-center justify-between rounded-lg bg-bg px-3 text-sm">
              <span>Field mode</span>
              <Switch
                checked={fieldMode}
                onCheckedChange={() => toggleFieldMode()}
                aria-label="Field mode"
              />
            </label>
            <button
              type="button"
              className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm hover:bg-bg"
              onClick={() => {
                setMoreOpen(false);
                signOut();
              }}
            >
              <LogOut className="size-4 text-muted" />
              Sign out
            </button>
            <button
              type="button"
              className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-bg"
              onClick={() => {
                resetDemo();
                setMoreOpen(false);
                navigate({ to: "/" });
              }}
            >
              <RotateCcw className="size-4" />
              Reset seeded demo
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? (
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

export function Bento({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoCell({
  label,
  value,
  hint,
  tone,
  className,
  children,
}: {
  label: string;
  value?: string | number;
  hint?: string;
  tone?: "critical" | "high" | "default";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      {value !== undefined ? (
        <p
          className={cn(
            "mt-2 font-mono text-3xl font-semibold tracking-tight tabular",
            tone === "critical" && "text-critical",
            tone === "high" && "text-high",
          )}
        >
          {value}
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {children}
    </div>
  );
}
