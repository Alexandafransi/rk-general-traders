"use client";

import { useEffect, useState } from "react";
import Icon from "../Icon";
import { useBranch } from "../branch/BranchContext";
import { useLocale } from "../i18n/LocaleContext";
import type { FinanceSummary } from "../types";
import { apiFetch } from "../../lib/auth/apiFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const BREAKDOWN_COLOR: Record<string, string> = {
  Payroll: "var(--chart-5)",
  Purchases: "var(--chart-2)",
  Expenses: "var(--chart-1)",
};

const BREAKDOWN_LABEL_KEY: Record<string, string> = {
  Payroll: "finance.breakdown.payroll",
  Purchases: "finance.breakdown.purchases",
  Expenses: "finance.breakdown.expenses",
};

function tzs(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `TZS ${Math.round(n).toLocaleString("en-US")}`;
}

function formatMonth(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FinancePage() {
  const { t } = useLocale();
  const { branchId } = useBranch();
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_URL}/api/finance/summary/?branch=${branchId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load finance data");
      });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("finance.loading")}</div>;

  const netProfit = parseFloat(data.kpis.net_profit);
  const headline: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("finance.kpi.revenue", { month: formatMonth(data.month) }), v: tzs(data.kpis.revenue_total), icon: "receipt", color: "var(--success)" },
    { l: t("finance.kpi.totalCosts"), v: tzs(data.kpis.total_costs), icon: "trending-up", color: "var(--destructive)" },
    {
      l: netProfit >= 0 ? t("finance.kpi.netProfit") : t("finance.kpi.netLoss"),
      v: tzs(Math.abs(netProfit)),
      icon: "target",
      color: netProfit >= 0 ? "var(--success)" : "var(--destructive)",
    },
  ];
  const costKpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("finance.breakdown.payroll"), v: tzs(data.kpis.payroll_total), icon: "check-square", color: "var(--chart-5)" },
    { l: t("finance.breakdown.purchases"), v: tzs(data.kpis.purchases_total), icon: "cart", color: "var(--chart-2)" },
    { l: t("finance.breakdown.expenses"), v: tzs(data.kpis.expenses_total), icon: "wallet", color: "var(--chart-1)" },
  ];

  const maxValue = Math.max(...data.breakdown.map((b) => parseFloat(b.value)), 1);

  return (
    <div className="dgrid">
      <div className="dkpi-row">
        {headline.map((k) => (
          <div key={k.l} className="dcard dkpi">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <p className="l">{k.l}</p>
              <span style={{ color: "var(--muted-foreground)" }}><Icon name={k.icon} /></span>
            </div>
            <p className="v tnum" style={{ color: k.color }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="dkpi-row">
        {costKpis.map((k) => (
          <div key={k.l} className="dcard dkpi">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <p className="l">{k.l}</p>
              <span style={{ color: "var(--muted-foreground)" }}><Icon name={k.icon} /></span>
            </div>
            <p className="v tnum" style={{ color: k.color, fontSize: 22 }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="dcard dc12">
        <div className="dcard-hd"><div><h3>{t("finance.costBreakdown.title")}</h3><p>{t("finance.costBreakdown.subtitle")}</p></div></div>
        <div className="dcard-bd" style={{ gap: 14, paddingTop: 4 }}>
          {data.breakdown.map((b) => {
            const value = parseFloat(b.value);
            const pct = maxValue ? Math.round((value / maxValue) * 100) : 0;
            const labelKey = BREAKDOWN_LABEL_KEY[b.label];
            return (
              <div key={b.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{labelKey ? t(labelKey) : b.label}</span>
                  <span className="tnum" style={{ color: "var(--muted-foreground)" }}>{tzs(value)}</span>
                </div>
                <span className="dmeter" style={{ height: 10, display: "block" }}>
                  <i style={{ width: `${pct}%`, background: BREAKDOWN_COLOR[b.label] || "var(--primary)" }} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dcard dc4">
        <div className="dcard-hd"><div><h3>{t("finance.sales.title")}</h3><p>{t("finance.sales.subtitle")}</p></div></div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>{t("finance.sales.col.customer")}</th><th className="num">{t("finance.sales.col.amount")}</th><th className="num">{t("finance.sales.col.date")}</th></tr></thead>
              <tbody>
                {data.recent_sales.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                    <td className="num tnum nw" style={{ color: "var(--success)" }}>{tzs(s.amount)}</td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(s.sale_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dcard dc4">
        <div className="dcard-hd"><div><h3>{t("finance.purchases.title")}</h3><p>{t("finance.purchases.subtitle")}</p></div></div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>{t("finance.purchases.col.item")}</th><th className="num">{t("finance.purchases.col.total")}</th><th className="num">{t("finance.purchases.col.date")}</th></tr></thead>
              <tbody>
                {data.recent_purchases.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.item_name}</td>
                    <td className="num tnum nw">{tzs(p.total_cost)}</td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(p.purchase_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dcard dc4">
        <div className="dcard-hd"><div><h3>{t("finance.expenses.title")}</h3><p>{t("finance.expenses.subtitle")}</p></div></div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>{t("finance.expenses.col.description")}</th><th className="num">{t("finance.expenses.col.amount")}</th><th className="num">{t("finance.expenses.col.date")}</th></tr></thead>
              <tbody>
                {data.recent_expenses.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500 }}>{e.description}</td>
                    <td className="num tnum nw" style={{ color: "var(--destructive)" }}>-{tzs(e.amount)}</td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(e.expense_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
