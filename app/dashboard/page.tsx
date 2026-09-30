"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import TrendChart, { TREND_SERIES } from "./TrendChart";
import { useBranch } from "./branch/BranchContext";
import { useLocale } from "./i18n/LocaleContext";
import { apiFetch } from "../lib/auth/apiFetch";
import type { DashboardSummary, DashboardTrends, Job, Todo } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

const STATUS_BADGE: Record<string, string> = {
  not_started: "neutral",
  in_progress: "info",
  review: "warning",
  on_hold: "warning",
  cancelled: "danger",
  done: "success",
};

const STATUS_PIE_COLOR: Record<string, string> = {
  not_started: "var(--chart-4)",
  in_progress: "var(--chart-1)",
  review: "var(--chart-5)",
  on_hold: "var(--chart-3)",
  cancelled: "var(--chart-6)",
  done: "var(--chart-2)",
};

const PRIORITY_ARROW: Record<string, string> = { high: "↑", medium: "→", low: "↓" };

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tzs(value: number) {
  return `TZS ${Math.round(value).toLocaleString("en-US")}`;
}

function initialsColor(tint: number) {
  const n = ((tint - 1) % 6) + 1;
  return { background: `var(--tint-${n})`, color: `var(--tint-${n}-fg)` };
}

export default function DashboardPage() {
  const { t } = useLocale();
  const { branchId } = useBranch();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [period, setPeriod] = useState(6);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_URL}/api/dashboard/summary/?branch=${branchId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`${API_URL}/api/dashboard/trends/?months=${period}&branch=${branchId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json) setTrends(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [period, branchId]);

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("dashboard.loading")}</div>;
  return (
    <>
      {trends?.access !== false && <AnalyticsSection trends={trends} period={period} onPeriodChange={setPeriod} />}
      <DashboardGrid data={data} />
    </>
  );
}

function AnalyticsSection({
  trends,
  period,
  onPeriodChange,
}: {
  trends: DashboardTrends | null;
  period: number;
  onPeriodChange: (p: number) => void;
}) {
  const { t } = useLocale();
  const totals = (trends?.series ?? []).reduce(
    (acc, s) => ({
      sales: acc.sales + parseFloat(s.sales),
      purchases: acc.purchases + parseFloat(s.purchases),
      expenses: acc.expenses + parseFloat(s.expenses),
      payroll: acc.payroll + parseFloat(s.payroll),
    }),
    { sales: 0, purchases: 0, expenses: 0, payroll: 0 }
  );
  const netProfit = totals.sales - totals.purchases - totals.expenses - totals.payroll;

  return (
    <div className="dgrid" style={{ marginBottom: "var(--card-gap)" }}>
      <div className="dcard dc8">
        <div className="dcard-hd">
          <div><h3>{t("dashboard.trend.title")}</h3><p>{t("dashboard.trend.subtitle")}</p></div>
          <div className="dtabbar" role="tablist" aria-label="Trend period" style={{ margin: 0 }}>
            {[3, 6, 12].map((p) => (
              <button key={p} role="tab" aria-selected={p === period} onClick={() => onPeriodChange(p)}>
                {p}M
              </button>
            ))}
          </div>
        </div>
        <div className="dcard-bd" style={{ paddingTop: 8 }}>
          {trends ? (
            <TrendChart series={trends.series} />
          ) : (
            <div className="dstate" style={{ padding: 30 }}>{t("dashboard.trend.loading")}</div>
          )}
          <div style={{ display: "flex", gap: 18, marginTop: 8, fontSize: 11.5, flexWrap: "wrap" }}>
            {TREND_SERIES.map((cfg) => (
              <span key={cfg.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: cfg.color }} />{t(cfg.labelKey)}
              </span>
            ))}
            <span style={{ color: "var(--muted-foreground)" }}>{t("dashboard.trend.helper")}</span>
          </div>
        </div>
      </div>

      <div className="dcard dc4">
        <div className="dcard-hd"><div><h3>{t("dashboard.totals.title", { period })}</h3><p>{t("dashboard.totals.subtitle")}</p></div></div>
        <div className="dcard-bd" style={{ paddingTop: 4, gap: 12 }}>
          <div style={{ textAlign: "center", padding: "6px 0 12px" }}>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{t("dashboard.totals.netProfit")}</div>
            <div className="tnum" style={{ fontSize: 26, fontWeight: 700, color: netProfit >= 0 ? "var(--success)" : "var(--destructive)" }}>
              {netProfit >= 0 ? "+" : "-"}{tzs(Math.abs(netProfit))}
            </div>
          </div>
          <TotalRow label={t("dashboard.series.sales")} value={totals.sales} color="var(--success)" />
          <TotalRow label={t("dashboard.series.purchases")} value={totals.purchases} color="var(--chart-1)" />
          <TotalRow label={t("dashboard.series.expenses")} value={totals.expenses} color="var(--destructive)" />
          <TotalRow label={t("dashboard.series.payroll")} value={totals.payroll} color="var(--chart-5)" />
        </div>
      </div>
    </div>
  );
}

function TotalRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted-foreground)" }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />{label}
      </span>
      <b className="tnum">{tzs(value)}</b>
    </div>
  );
}

function DashboardGrid({ data }: { data: DashboardSummary }) {
  const { t } = useLocale();
  const kpis: { l: string; v: number; p: number; hint?: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [];
  if (data.access.leads) {
    kpis.push({ l: t("dashboard.kpi.convertedLeads"), v: data.kpis.converted_leads, p: data.kpis.converted_leads_pct, icon: "target", color: "var(--chart-1)" });
  }
  if (data.access.jobs) {
    kpis.push(
      { l: t("dashboard.kpi.jobsInProgress"), v: data.kpis.active_jobs, p: data.kpis.total_jobs ? Math.round((data.kpis.active_jobs / data.kpis.total_jobs) * 100) : 0, icon: "folder", color: "var(--chart-5)" },
      { l: t("dashboard.kpi.jobsUnfinished"), v: data.kpis.unfinished_jobs, p: data.kpis.unfinished_jobs_pct, hint: t("dashboard.kpi.stillOpen", { pct: data.kpis.unfinished_jobs_pct }), icon: "flag", color: "var(--chart-2)" }
    );
  }

  return (
    <div className="dgrid">
      {kpis.length > 0 && (
        <div className="dkpi-row">
          {kpis.map((k) => (
            <div key={k.l} className="dcard dkpi">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <p className="l">{k.l}</p>
                <span style={{ color: "var(--muted-foreground)" }}><Icon name={k.icon} /></span>
              </div>
              <p className="v tnum">{k.v}</p>
              <div className="dmeter-row">
                <span className="dhint" style={{ color: k.color }}>{k.hint || t("dashboard.kpi.completed", { pct: k.p })}</span>
                <span className="dmeter"><i style={{ width: `${k.p}%`, background: k.color }} /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.access.jobs && (
        <div className="dcard dc8">
          <div className="dcard-hd">
            <div><h3>{t("dashboard.jobs.title")}</h3><p>{t("dashboard.jobs.subtitle")}</p></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a href="/dashboard/jobs" className="dlink">{t("common.viewAll")}</a>
              <button className="dbtn"><Icon name="download" />{t("dashboard.jobs.export")}</button>
            </div>
          </div>
          <JobsTable jobs={data.recent_jobs} total={data.kpis.total_jobs} />
        </div>
      )}

      {data.access.leads && data.lead_conversion && (
        <div className="dcard dc4">
          <div className="dcard-hd">
            <div><h3>{t("dashboard.leads.title")}</h3><p>{t("dashboard.leads.subtitle")}</p></div>
            <a href="/dashboard/leads" className="dlink">{t("common.viewAll")}</a>
          </div>
          <div className="dcard-bd" style={{ alignItems: "center", justifyContent: "center", gap: 14 }}>
            <LeadsGauge conversion={data.lead_conversion} />
          </div>
        </div>
      )}

      {data.access.jobs && (
        <div className="dcard dc7">
          <div className="dcard-hd">
            <div><h3>{t("dashboard.todos.title")}</h3><p>{t("dashboard.todos.subtitle")}</p></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a href="#" className="dlink">{t("common.viewAll")}</a>
              <button className="dbtn primary"><Icon name="plus" />{t("dashboard.todos.newTodo")}</button>
            </div>
          </div>
          <div className="dcard-bd" style={{ paddingTop: 2 }}>
            {data.todos.map((td) => <TodoRow key={td.id} todo={td} />)}
          </div>
        </div>
      )}

      {data.access.jobs && (
        <div className="dcard dc5">
          <div className="dcard-hd"><div><h3>{t("dashboard.statusPie.title")}</h3><p>{t("dashboard.statusPie.subtitle")}</p></div></div>
          <div className="dcard-bd" style={{ alignItems: "center", justifyContent: "center", gap: 14 }}>
            <StatusPie breakdown={data.job_status_breakdown} />
          </div>
        </div>
      )}

      {!data.access.leads && !data.access.jobs && (
        <div className="dcard dc12">
          <div className="dcard-bd" style={{ alignItems: "center", justifyContent: "center", padding: 40 }}>
            <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{t("dashboard.noWidgets")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function JobsTable({ jobs, total }: { jobs: Job[]; total: number }) {
  const { t } = useLocale();
  const shown = jobs.slice(0, 5);
  return (
    <>
      <div className="dtabbar" role="tablist" aria-label="Job views">
        <button role="tab" aria-selected="true"><Icon name="check-square" size={14} />{t("dashboard.jobs.tab.myJobs")}</button>
        <button role="tab" aria-selected="false"><Icon name="folder" size={14} />{t("dashboard.jobs.tab.byCategory")}</button>
        <button role="tab" aria-selected="false"><Icon name="clock" size={14} />{t("dashboard.jobs.tab.thisWeek")}</button>
        <button role="tab" aria-selected="false"><Icon name="life" size={14} />{t("dashboard.jobs.tab.support")}</button>
      </div>
      <div className="dcard-bd flush" style={{ paddingTop: 6, paddingBottom: 0 }}>
        <div className="dtable-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 38 }}>
                  <span className="dchk on"><Icon name="check" size={10} strokeWidth={3} /></span>
                </th>
                <th style={{ width: 62 }}>{t("dashboard.jobs.col.jobNumber")}</th>
                <th>{t("dashboard.jobs.col.job")}</th>
                <th>{t("dashboard.jobs.col.status")}</th>
                <th>{t("dashboard.jobs.col.startDate")}</th>
                <th>{t("dashboard.jobs.col.category")}</th>
                <th className="num">{t("dashboard.jobs.col.priority")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((job) => (
                <tr key={job.id}>
                  <td>
                    <span className={`dchk ${job.status === "done" ? "on" : ""}`}>
                      {job.status === "done" && <Icon name="check" size={10} strokeWidth={3} />}
                    </span>
                  </td>
                  <td className="tnum" style={{ color: "var(--muted-foreground)" }}>{job.job_number}</td>
                  <td style={{ fontWeight: 500 }}>{job.title}</td>
                  <td className="nw">
                    <span className={`dbadge ${STATUS_BADGE[job.status] || "neutral"}`}><i />{t(`enums.jobStatus.${job.status}`)}</span>
                  </td>
                  <td className="tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(job.start_date)}</td>
                  <td className="nw"><span className="dtag">{t(`enums.serviceCategory.${job.category}`)}</span></td>
                  <td className="num nw" style={{ fontWeight: 500 }}>
                    {PRIORITY_ARROW[job.priority]} {t(`enums.priority.${job.priority}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px var(--card-pad)", borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--muted-foreground)" }}>
        <span>{t("dashboard.jobs.pagination", { shown: shown.length, total })}</span>
        <span style={{ display: "flex", gap: 6 }}>
          <button className="dbtn" style={{ height: 26, padding: "0 10px" }}>{t("dashboard.jobs.previous")}</button>
          <button className="dbtn" style={{ height: 26, padding: "0 10px" }}>{t("dashboard.jobs.next")}</button>
        </span>
      </div>
    </>
  );
}

function TodoRow({ todo }: { todo: Todo }) {
  return (
    <div className="dtodo">
      <span className={`dchk ${todo.done ? "on" : ""}`} style={{ marginTop: 2 }}>
        {todo.done && <Icon name="check" size={10} strokeWidth={3} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={todo.done ? { textDecoration: "line-through", color: "var(--muted-foreground)" } : undefined}>{todo.title}</h4>
        <p>{todo.description}</p>
        <div className="meta">
          <Icon name="calendar" size={13} />
          {formatDate(todo.due_date)}
          {todo.assigned_to && (
            <>
              <span className="davatar" style={initialsColor(todo.assigned_to.tint)}>{todo.assigned_to.initials}</span>
              {todo.assigned_to.name}
            </>
          )}
        </div>
      </div>
      <button className="dash-icon-btn" aria-label="More actions"><Icon name="dots" /></button>
    </div>
  );
}

function LeadsGauge({ conversion }: { conversion: NonNullable<DashboardSummary["lead_conversion"]> }) {
  const { t } = useLocale();
  const R = 70, SW = 20, C = 2 * Math.PI * R, SPAN = 0.78;
  const conv = conversion.conversion_rate / 100;
  return (
    <>
      <div style={{ position: "relative", width: 180, height: 180 }}>
        <svg
          viewBox="0 0 180 180"
          style={{ width: 180, height: 180, transform: "rotate(130deg)" }}
          role="img"
          aria-label={`${conversion.conversion_rate}% of leads converted to customers`}
        >
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--muted)" strokeWidth={SW} strokeLinecap="round" strokeDasharray={`${C * SPAN} ${C}`} />
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--chart-2)" strokeWidth={SW} strokeLinecap="round" strokeDasharray={`${C * SPAN * conv} ${C}`} strokeDashoffset={0} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.04em" }} className="tnum">{conversion.conversion_rate}%</div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: -2 }}>{t("dashboard.leads.converted")}</div>
          </div>
        </div>
      </div>
      <ul style={{ display: "flex", gap: 18, fontSize: 11.5 }}>
        <li style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--chart-2)" }} />
          {t("dashboard.leads.customers")} <b className="tnum">{conversion.converted}</b>
        </li>
        <li style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--muted)" }} />
          {t("dashboard.leads.lostLeads")} <b className="tnum">{conversion.lost}</b>
        </li>
      </ul>
    </>
  );
}

function StatusPie({ breakdown }: { breakdown: DashboardSummary["job_status_breakdown"] }) {
  const { t } = useLocale();
  const total = breakdown.reduce((a, b) => a + b.count, 0) || 1;
  const cx = 85, cy = 85, r = 78;
  let a0 = -Math.PI / 2;
  const slices = breakdown.map((d) => {
    const a1 = a0 + (d.count / total) * 2 * Math.PI;
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const path = `M${cx},${cy} L${(cx + r * Math.cos(a0)).toFixed(2)},${(cy + r * Math.sin(a0)).toFixed(2)} A${r},${r} 0 ${big} 1 ${(cx + r * Math.cos(a1)).toFixed(2)},${(cy + r * Math.sin(a1)).toFixed(2)} Z`;
    a0 = a1;
    return { ...d, path, color: STATUS_PIE_COLOR[d.status] || "var(--muted)", label: t(`enums.jobStatus.${d.status}`) };
  });

  return (
    <>
      <svg
        viewBox="0 0 170 170"
        style={{ width: 170, height: 170 }}
        role="img"
        aria-label={`Job status split: ${slices.map((b) => `${b.label} ${b.count}`).join(", ")}`}
      >
        {slices.map((s) => (
          <path key={s.status} d={s.path} fill={s.color} stroke="var(--card)" strokeWidth={2} />
        ))}
      </svg>
      <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: "5px 16px", fontSize: 11.5 }}>
        {slices.map((s) => (
          <li key={s.status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
            <span style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
            <b className="tnum">{s.count}</b>
          </li>
        ))}
      </ul>
    </>
  );
}
