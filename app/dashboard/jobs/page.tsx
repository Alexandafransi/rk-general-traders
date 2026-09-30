"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { useBranch } from "../branch/BranchContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";
import type { Branch, Job, JobsSummary, Technician } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const CATEGORIES = [
  { value: "fiber_installation" },
  { value: "router_setup" },
  { value: "wifi_extender" },
  { value: "mikrotik_voucher" },
  { value: "access_point" },
  { value: "fiber_onu_ont" },
  { value: "power_backup" },
  { value: "support" },
];

const STATUSES = [
  { value: "not_started" },
  { value: "in_progress" },
  { value: "review" },
  { value: "on_hold" },
  { value: "cancelled" },
  { value: "done" },
];

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initialsColor(tint: number) {
  const n = ((tint - 1) % 6) + 1;
  return { background: `var(--tint-${n})`, color: `var(--tint-${n}-fg)` };
}

type JobForm = {
  title: string;
  customer_name: string;
  location: string;
  category: string;
  status: string;
  priority: string;
  assigned_to_id: string;
  start_date: string;
  branch_id: string;
};

function blankForm(defaultBranchId: string): JobForm {
  return {
    title: "",
    customer_name: "",
    location: "",
    category: "router_setup",
    status: "not_started",
    priority: "medium",
    assigned_to_id: "",
    start_date: new Date().toISOString().slice(0, 10),
    branch_id: defaultBranchId,
  };
}

export default function JobsPage() {
  const { t } = useLocale();
  const { branches, branchId } = useBranch();
  const [data, setData] = useState<JobsSummary | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Job | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fStatus, setFStatus] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [fTechnician, setFTechnician] = useState("");

  const branchIdRef = useRef(branchId);
  useEffect(() => {
    branchIdRef.current = branchId;
  }, [branchId]);

  function load() {
    const requestBranch = branchId;
    Promise.all([
      apiFetch(`${API_URL}/api/jobs/summary/?branch=${branchId}`).then((r) => {
        if (!r.ok) throw new Error(`API responded ${r.status}`);
        return r.json();
      }),
      apiFetch(`${API_URL}/api/technicians/`).then((r) => r.json()),
    ])
      .then(([summary, techRes]) => {
        if (requestBranch !== branchIdRef.current) return;
        setData(summary);
        setTechnicians(techRes.results || techRes);
      })
      .catch((err) => {
        if (requestBranch !== branchIdRef.current) return;
        setError(err instanceof Error ? err.message : t("jobs.loadError"));
      });
  }

  useEffect(load, [branchId]);

  async function handleDelete(j: Job) {
    if (!window.confirm(t("jobs.confirmDelete", { jobNumber: j.job_number, title: j.title }))) return;
    await apiFetch(`${API_URL}/api/jobs/${j.id}/`, { method: "DELETE" });
    load();
  }

  const allJobs = useMemo(() => data?.jobs ?? [], [data]);
  const filtered = useMemo(() => {
    return allJobs.filter((j) => {
      if (fStatus && j.status !== fStatus) return false;
      if (fCategory && j.category !== fCategory) return false;
      if (fPriority && j.priority !== fPriority) return false;
      if (fTechnician && String(j.assigned_to?.id ?? "") !== fTechnician) return false;
      return true;
    });
  }, [allJobs, fStatus, fCategory, fPriority, fTechnician]);
  const hasFilters = Boolean(fStatus || fCategory || fPriority || fTechnician);
  function clearFilters() { setFStatus(""); setFCategory(""); setFPriority(""); setFTechnician(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("jobs.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("jobs.kpi.total"), v: String(data.kpis.total_jobs), icon: "folder", color: "var(--chart-1)" },
    { l: t("jobs.kpi.active"), v: String(data.kpis.active_jobs), icon: "clock", color: "var(--chart-5)" },
    { l: t("jobs.kpi.completedThisMonth"), v: String(data.kpis.done_this_month), icon: "check-square", color: "var(--success)" },
    { l: t("jobs.kpi.unassigned"), v: String(data.kpis.unassigned_jobs), icon: "flag", color: "var(--warning-foreground)" },
  ];

  const maxJobs = Math.max(...data.by_technician.map((t) => t.jobs_completed), 1);

  return (
    <div className="dgrid">
      <div className="dgrid" style={{ gridColumn: "span 12", marginBottom: "var(--card-gap)" }}>
        {kpis.map((k) => (
          <div key={k.l} className="dcard dkpi" style={{ padding: "var(--card-pad)", gridColumn: "span 3" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <p className="l">{k.l}</p>
              <span style={{ color: "var(--muted-foreground)" }}><Icon name={k.icon} /></span>
            </div>
            <p className="v tnum" style={{ color: k.color, fontSize: 22 }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="dcard dc8" style={{ marginBottom: "var(--card-gap)" }}>
        <div className="dcard-hd"><div><h3>{t("jobs.statusCard.title")}</h3><p>{t("jobs.statusCard.subtitle")}</p></div></div>
        <div className="dcard-bd" style={{ alignItems: "center", justifyContent: "center", gap: 14 }}>
          <StatusPie breakdown={data.status_breakdown} />
        </div>
      </div>

      <div className="dcard dc4" style={{ marginBottom: "var(--card-gap)" }}>
        <div className="dcard-hd"><div><h3>{t("jobs.workload.title")}</h3><p>{t("jobs.workload.subtitle")}</p></div></div>
        <div className="dcard-bd" style={{ paddingTop: 6, gap: 14 }}>
          {data.by_technician.length === 0 && (
            <p style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>{t("jobs.workload.empty")}</p>
          )}
          {data.by_technician.map((tech) => (
            <div key={tech.technician_id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="davatar" style={initialsColor(tech.tint)}>
                    {tech.name.split(" ").map((w) => w[0]).join("").toUpperCase()}
                  </span>
                  {tech.name}
                </span>
                <b className="tnum">{tech.jobs_completed}</b>
              </div>
              <span className="dmeter" style={{ height: 6, display: "block" }}>
                <i style={{ width: `${Math.round((tech.jobs_completed / maxJobs) * 100)}%`, background: initialsColor(tech.tint).color }} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("jobs.main.title")}</h3><p>{t("jobs.main.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("jobs.addJob")}
          </button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="jf-status">{t("jobs.filter.status")}</label>
            <select id="jf-status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">{t("common.allStatuses")}</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{t(`enums.jobStatus.${s.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="jf-category">{t("jobs.filter.category")}</label>
            <select id="jf-category" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
              <option value="">{t("common.allCategories")}</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{t(`enums.serviceCategory.${c.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="jf-priority">{t("jobs.filter.priority")}</label>
            <select id="jf-priority" value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
              <option value="">{t("jobs.filter.allPriorities")}</option>
              <option value="high">{t("enums.priority.high")}</option>
              <option value="medium">{t("enums.priority.medium")}</option>
              <option value="low">{t("enums.priority.low")}</option>
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="jf-tech">{t("jobs.filter.technician")}</label>
            <select id="jf-tech" value={fTechnician} onChange={(e) => setFTechnician(e.target.value)}>
              <option value="">{t("jobs.filter.allTechnicians")}</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allJobs.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("jobs.table.jobNumber")}</th>
                  <th>{t("jobs.table.job")}</th>
                  <th>{t("jobs.table.customer")}</th>
                  <th>{t("jobs.table.category")}</th>
                  <th>{t("jobs.table.status")}</th>
                  <th className="num">{t("jobs.table.priority")}</th>
                  <th>{t("jobs.table.assignedTo")}</th>
                  <th className="num">{t("jobs.table.startDate")}</th>
                  {branchId === "all" && <th>{t("nav.branch")}</th>}
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id}>
                    <td className="tnum nw" style={{ color: "var(--muted-foreground)" }}>{j.job_number}</td>
                    <td style={{ fontWeight: 500 }}>{j.title}</td>
                    <td style={{ color: "var(--muted-foreground)" }}>{j.customer_name}</td>
                    <td className="nw"><span className="dtag">{t(`enums.serviceCategory.${j.category}`)}</span></td>
                    <td className="nw"><span className={`dbadge ${STATUS_BADGE[j.status] || "neutral"}`}><i />{t(`enums.jobStatus.${j.status}`)}</span></td>
                    <td className="num nw" style={{ fontWeight: 500 }}>{PRIORITY_ARROW[j.priority]} {t(`enums.priority.${j.priority}`)}</td>
                    <td className="nw">
                      {j.assigned_to ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="davatar" style={initialsColor(j.assigned_to.tint)}>{j.assigned_to.initials}</span>
                          {j.assigned_to.name}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(j.start_date)}</td>
                    {branchId === "all" && <td className="nw" style={{ color: "var(--muted-foreground)" }}>{j.branch?.name || "—"}</td>}
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("jobs.actions.edit")} onClick={() => { setEditing(j); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("jobs.actions.delete")} onClick={() => handleDelete(j)}>
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <JobFormModal
          job={editing}
          technicians={technicians}
          branches={branches}
          activeBranchId={branchId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function StatusPie({ breakdown }: { breakdown: JobsSummary["status_breakdown"] }) {
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
        aria-label={t("jobs.statusPie.ariaLabel", { items: slices.map((s) => `${s.label} ${s.count}`).join(", ") })}
      >
        {slices.map((s) => (
          <path key={s.status} d={s.path} fill={s.color} stroke="var(--card)" strokeWidth={2} />
        ))}
      </svg>
      <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px 16px", fontSize: 11.5 }}>
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

function JobFormModal({
  job,
  technicians,
  branches,
  activeBranchId,
  onClose,
  onSaved,
}: {
  job: Job | null;
  technicians: Technician[];
  branches: Branch[];
  activeBranchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const { hasRole } = useAuth();
  const canPickBranch = hasRole("superadmin", "admin");
  const defaultBranchId =
    activeBranchId !== "all" ? activeBranchId : branches[0] ? String(branches[0].id) : "";
  const [form, setForm] = useState<JobForm>(
    job
      ? {
          title: job.title,
          customer_name: job.customer_name,
          location: job.location,
          category: job.category,
          status: job.status,
          priority: job.priority,
          assigned_to_id: job.assigned_to ? String(job.assigned_to.id) : "",
          start_date: job.start_date || "",
          branch_id: job.branch ? String(job.branch.id) : defaultBranchId,
        }
      : blankForm(defaultBranchId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = job ? `${API_URL}/api/jobs/${job.id}/` : `${API_URL}/api/jobs/`;
      const payload = {
        title: form.title,
        customer_name: form.customer_name,
        location: form.location,
        category: form.category,
        status: form.status,
        priority: form.priority,
        assigned_to_id: form.assigned_to_id ? Number(form.assigned_to_id) : null,
        start_date: form.start_date || null,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
      };
      const res = await apiFetch(url, {
        method: job ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobs.form.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={job ? t("jobs.form.editTitle", { jobNumber: job.job_number }) : t("jobs.addJob")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="j-title">{t("jobs.form.jobTitle")}</label>
          <input id="j-title" required value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="j-customer">{t("jobs.form.customerName")}</label>
            <input id="j-customer" required value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="j-location">{t("jobs.form.location")}</label>
            <input id="j-location" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="j-category">{t("jobs.form.category")}</label>
            <select id="j-category" value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{t(`enums.serviceCategory.${c.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="j-priority">{t("jobs.form.priority")}</label>
            <select id="j-priority" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
              <option value="high">{t("enums.priority.high")}</option>
              <option value="medium">{t("enums.priority.medium")}</option>
              <option value="low">{t("enums.priority.low")}</option>
            </select>
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="j-branch">{t("nav.branch")}</label>
            {canPickBranch ? (
              <select id="j-branch" required value={form.branch_id} onChange={(e) => update("branch_id", e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <input id="j-branch" value={branches.find((b) => String(b.id) === form.branch_id)?.name ?? ""} disabled readOnly />
            )}
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="j-status">{t("jobs.form.status")}</label>
            <select id="j-status" value={form.status} onChange={(e) => update("status", e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{t(`enums.jobStatus.${s.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="j-start">{t("jobs.form.startDate")}</label>
            <input id="j-start" type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="j-tech">{t("jobs.form.assignedTechnician")}</label>
          <select id="j-tech" value={form.assigned_to_id} onChange={(e) => update("assigned_to_id", e.target.value)}>
            <option value="">{t("common.unassigned")}</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>{tech.name}</option>
            ))}
          </select>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : job ? t("common.saveChanges") : t("jobs.form.submitAdd")}</button>
        </div>
      </form>
    </Modal>
  );
}
