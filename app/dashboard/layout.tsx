"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Icon from "./Icon";
import { BranchProvider, useBranch } from "./branch/BranchContext";
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import { AuthProvider, useAuth } from "../lib/auth/AuthContext";
import "./dashboard.css";

type NavItem = {
  labelKey: string;
  href: string;
  icon: Parameters<typeof Icon>[0]["name"];
  module: string;
};

// Role management is superadmin-only, deliberately excluded even from Admin
// — sentinel handled separately from the dynamic can(module) mechanism.
const SUPERADMIN_ONLY = "__superadmin__";

const NAV_GROUPS: { groupKey: string; items: NavItem[] }[] = [
  {
    groupKey: "nav.group.operations",
    items: [
      { labelKey: "nav.item.dashboard", href: "/dashboard", icon: "grid", module: "dashboard" },
      { labelKey: "nav.item.branches", href: "/dashboard/branches", icon: "store", module: "branches" },
      { labelKey: "nav.item.jobs", href: "/dashboard/jobs", icon: "folder", module: "jobs" },
      { labelKey: "nav.item.leads", href: "/dashboard/leads", icon: "target", module: "leads" },
      { labelKey: "nav.item.customers", href: "/dashboard/customers", icon: "users", module: "customers" },
    ],
  },
  {
    groupKey: "nav.group.people",
    items: [
      { labelKey: "nav.item.accounts", href: "/dashboard/accounts", icon: "key", module: "accounts" },
      { labelKey: "nav.item.roles", href: "/dashboard/roles", icon: "shield", module: SUPERADMIN_ONLY },
      { labelKey: "nav.item.auditLog", href: "/dashboard/audit-log", icon: "clock", module: SUPERADMIN_ONLY },
      { labelKey: "nav.item.users", href: "/dashboard/users", icon: "tool", module: "staff" },
      { labelKey: "nav.item.payroll", href: "/dashboard/payroll", icon: "check-square", module: "payroll" },
    ],
  },
  {
    groupKey: "nav.group.finance",
    items: [
      { labelKey: "nav.item.finance", href: "/dashboard/finance", icon: "trending-up", module: "finance" },
      { labelKey: "nav.item.sales", href: "/dashboard/sales", icon: "receipt", module: "sales" },
      { labelKey: "nav.item.purchases", href: "/dashboard/purchases", icon: "cart", module: "purchases" },
      { labelKey: "nav.item.inventory", href: "/dashboard/inventory", icon: "box", module: "inventory" },
      { labelKey: "nav.item.expenses", href: "/dashboard/expenses", icon: "wallet", module: "expenses" },
      { labelKey: "nav.item.suppliers", href: "/dashboard/suppliers", icon: "truck", module: "suppliers" },
    ],
  },
  {
    groupKey: "nav.group.support",
    items: [{ labelKey: "nav.item.support", href: "#", icon: "life", module: "dashboard" }],
  },
];

const MODULE_BY_PATH: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.href, i.module]))
);

const PAGE_META_KEYS: Record<string, { titleKey: string; subtitleKey: string }> = {
  "/dashboard": { titleKey: "nav.title.dashboard", subtitleKey: "nav.subtitle.dashboard" },
  "/dashboard/branches": { titleKey: "nav.title.branches", subtitleKey: "nav.subtitle.branches" },
  "/dashboard/accounts": { titleKey: "nav.title.accounts", subtitleKey: "nav.subtitle.accounts" },
  "/dashboard/roles": { titleKey: "nav.title.roles", subtitleKey: "nav.subtitle.roles" },
  "/dashboard/audit-log": { titleKey: "nav.title.auditLog", subtitleKey: "nav.subtitle.auditLog" },
  "/dashboard/jobs": { titleKey: "nav.title.jobs", subtitleKey: "nav.subtitle.jobs" },
  "/dashboard/leads": { titleKey: "nav.title.leads", subtitleKey: "nav.subtitle.leads" },
  "/dashboard/customers": { titleKey: "nav.title.customers", subtitleKey: "nav.subtitle.customers" },
  "/dashboard/users": { titleKey: "nav.title.users", subtitleKey: "nav.subtitle.users" },
  "/dashboard/payroll": { titleKey: "nav.title.payroll", subtitleKey: "nav.subtitle.payroll" },
  "/dashboard/sales": { titleKey: "nav.title.sales", subtitleKey: "nav.subtitle.sales" },
  "/dashboard/purchases": { titleKey: "nav.title.purchases", subtitleKey: "nav.subtitle.purchases" },
  "/dashboard/inventory": { titleKey: "nav.title.inventory", subtitleKey: "nav.subtitle.inventory" },
  "/dashboard/expenses": { titleKey: "nav.title.expenses", subtitleKey: "nav.subtitle.expenses" },
  "/dashboard/suppliers": { titleKey: "nav.title.suppliers", subtitleKey: "nav.subtitle.suppliers" },
  "/dashboard/finance": { titleKey: "nav.title.finance", subtitleKey: "nav.subtitle.finance" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>
        <BranchProvider>
          <AuthGuard>{children}</AuthGuard>
        </BranchProvider>
      </LocaleProvider>
    </AuthProvider>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="dash-root" style={{ display: "grid", placeItems: "center", minHeight: "100dvh" }}>
        <div className="dstate">Loading…</div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const { branches, branchId, setBranchId } = useBranch();
  const { user, hasRole, can, logout } = useAuth();
  const meta = PAGE_META_KEYS[pathname] || PAGE_META_KEYS["/dashboard"];
  function canSeeNavItem(item: NavItem) {
    if (item.href === "#") return true;
    if (item.module === SUPERADMIN_ONLY) return hasRole("superadmin");
    return can(item.module);
  }
  const visibleGroups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter(canSeeNavItem) })).filter((g) => g.items.length);
  const isBranchLocked = !hasRole("superadmin", "admin");

  useEffect(() => {
    if (isBranchLocked && user?.branch && branchId !== String(user.branch.id)) {
      setBranchId(String(user.branch.id));
    }
  }, [isBranchLocked, user, branchId, setBranchId]);

  if (!user) return null; // AuthGuard only renders this once `user` is set

  const routeModule = MODULE_BY_PATH[pathname];
  const denied = routeModule
    ? routeModule === SUPERADMIN_ONLY
      ? !hasRole("superadmin")
      : !can(routeModule)
    : false;
  const displayName = user.full_name || user.username;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="dash-root">
      <div className="dash-shell">
        <aside className="dash-side">
          <div className="dash-side-hd">
            <span className="dash-logo">RK</span>
            <b>RK General Traders</b>
          </div>
          <div className="dash-nav" role="navigation" aria-label="Primary">
            {visibleGroups.map((group) => (
              <div key={group.groupKey}>
                <div className="cat">{t(group.groupKey)}</div>
                {group.items.map((item) => (
                  <a key={item.labelKey} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                    <Icon name={item.icon} />
                    {t(item.labelKey)}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="dash-side-ft">
            <button className="u" onClick={logout} title={t("nav.logout")}>
              <span className="davatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--tint-1)", color: "var(--tint-1-fg)" }}>{initials}</span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <b style={{ display: "block", fontSize: 12.5 }} className="trunc">{displayName}</b>
                <span style={{ display: "block", fontSize: 11, color: "var(--muted-foreground)" }}>{user.role_display}</span>
              </span>
              <Icon name="log-out" />
            </button>
          </div>
        </aside>

        <div className="dash-main">
          <header className="dash-topbar">
            <h1>{denied ? t("nav.accessDenied.title") : t(meta.titleKey)}</h1>
            <span className="sub">{denied ? t("nav.accessDenied.subtitle") : t(meta.subtitleKey)}</span>
            {isBranchLocked ? (
              <span
                style={{
                  height: 30, padding: "0 11px", border: "1px solid var(--input)", borderRadius: "var(--radius-sm)",
                  fontSize: 12, background: "var(--muted)", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="store" size={13} />
                {user.branch ? user.branch.name : t("nav.allBranches")}
              </span>
            ) : (
              <select
                aria-label={t("nav.branch")}
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                style={{
                  height: 30, padding: "0 9px", border: "1px solid var(--input)", borderRadius: "var(--radius-sm)",
                  fontSize: 12, background: "var(--card)", color: "var(--foreground)", fontFamily: "inherit",
                }}
              >
                <option value="all">{t("nav.allBranches")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            <div className="dtabbar" role="tablist" aria-label={t("nav.language")} style={{ margin: 0 }}>
              <button role="tab" aria-selected={locale === "en"} onClick={() => setLocale("en")}>EN</button>
              <button role="tab" aria-selected={locale === "sw"} onClick={() => setLocale("sw")}>SW</button>
            </div>
            <button className="dash-icon-btn" aria-label="Notifications">
              <Icon name="bell" />
              <span className="dot" />
            </button>
            <button className="dash-icon-btn" aria-label={t("nav.logout")} onClick={logout}>
              <Icon name="log-out" />
            </button>
          </header>

          <main className="dash-content">
            {denied ? (
              <div className="dstate" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 60 }}>
                <Icon name="key" size={26} />
                <b>{t("nav.accessDenied.title")}</b>
                <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{t("nav.accessDenied.subtitle")}</span>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
