"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import type { Payslip, PayrollSummary, Technician } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function initialsColor(tint: number) {
  const n = ((tint - 1) % 6) + 1;
  return { background: `var(--tint-${n})`, color: `var(--tint-${n}-fg)` };
}

function tzs(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `TZS ${Math.round(n).toLocaleString("en-US")}`;
}

function formatPeriod(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type PayslipForm = {
  technician_id: string;
  period: string;
  base_salary: string;
  allowances: string;
  deductions: string;
  status: string;
  paid_date: string;
};

function blankForm(technicians: Technician[]): PayslipForm {
  const first = technicians[0];
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    technician_id: first ? String(first.id) : "",
    period,
    base_salary: first ? first.monthly_salary : "0",
    allowances: "0",
    deductions: "0",
    status: "draft",
    paid_date: "",
  };
}

export default function PayrollPage() {
  const { t } = useLocale();
  const [data, setData] = useState<PayrollSummary | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Payslip | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkPay, setShowBulkPay] = useState(false);
  const [fTechnician, setFTechnician] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPeriod, setFPeriod] = useState("");

  function load() {
    Promise.all([
      apiFetch(`${API_URL}/api/payroll/summary/`).then((r) => {
        if (!r.ok) throw new Error(`API responded ${r.status}`);
        return r.json();
      }),
      apiFetch(`${API_URL}/api/technicians/`).then((r) => r.json()),
    ])
      .then(([summary, techRes]) => {
        setData(summary);
        setTechnicians(techRes.results || techRes);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("payroll.errors.loadFailed")));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Payslip) {
    setEditing(p);
    setShowForm(true);
  }

  async function handleDelete(p: Payslip) {
    if (!window.confirm(t("payroll.deleteConfirm", { name: p.technician.name, period: formatPeriod(p.period) }))) return;
    await apiFetch(`${API_URL}/api/payslips/${p.id}/`, { method: "DELETE" });
    load();
  }

  const allPayslips = useMemo(() => data?.payslips ?? [], [data]);
  const filtered = useMemo(() => {
    return allPayslips.filter((p) => {
      if (fTechnician && String(p.technician.id) !== fTechnician) return false;
      if (fStatus && p.status !== fStatus) return false;
      if (fPeriod && p.period.slice(0, 7) !== fPeriod) return false;
      return true;
    });
  }, [allPayslips, fTechnician, fStatus, fPeriod]);
  const hasFilters = Boolean(fTechnician || fStatus || fPeriod);
  function clearFilters() { setFTechnician(""); setFStatus(""); setFPeriod(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("payroll.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: data.latest_period ? t("payroll.kpi.payrollPeriod", { period: formatPeriod(data.latest_period) }) : t("payroll.kpi.payrollThisMonth"), v: tzs(data.kpis.total_this_month), icon: "target", color: "var(--chart-1)" },
    { l: t("payroll.kpi.paidPayslips"), v: String(data.kpis.paid_this_month), icon: "check-square", color: "var(--success)" },
    { l: t("payroll.kpi.pendingPayslips"), v: String(data.kpis.pending_this_month), icon: "clock", color: "var(--warning-foreground)" },
    { l: t("payroll.kpi.staffOnPayroll"), v: String(data.kpis.staff_on_payroll), icon: "users", color: "var(--chart-5)" },
  ];

  return (
    <div className="dgrid">
      <div className="dkpi-row">
        {kpis.map((k) => (
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
        <div className="dcard-hd">
          <div><h3>{t("payroll.title")}</h3><p>{t("payroll.subtitle")}</p></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="dbtn" onClick={openCreate}><Icon name="plus" />{t("payroll.addPayslip")}</button>
            <button className="dbtn primary" onClick={() => setShowBulkPay(true)}><Icon name="check-square" />{t("payroll.recordPayment")}</button>
          </div>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="pyf-tech">{t("payroll.filter.staffLabel")}</label>
            <select id="pyf-tech" value={fTechnician} onChange={(e) => setFTechnician(e.target.value)}>
              <option value="">{t("payroll.filter.allStaff")}</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="pyf-status">{t("payroll.filter.statusLabel")}</label>
            <select id="pyf-status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">{t("common.allStatuses")}</option>
              <option value="draft">{t("enums.payslipStatus.draft")}</option>
              <option value="paid">{t("enums.payslipStatus.paid")}</option>
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="pyf-period">{t("payroll.filter.periodLabel")}</label>
            <input id="pyf-period" type="month" value={fPeriod} onChange={(e) => setFPeriod(e.target.value)} />
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allPayslips.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("payroll.col.staff")}</th>
                  <th>{t("payroll.col.period")}</th>
                  <th className="num">{t("payroll.col.baseSalary")}</th>
                  <th className="num">{t("payroll.col.allowances")}</th>
                  <th className="num">{t("payroll.col.deductions")}</th>
                  <th className="num">{t("payroll.col.netPay")}</th>
                  <th>{t("payroll.col.status")}</th>
                  <th className="num">{t("payroll.col.paidOn")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <PayslipRow key={p.id} payslip={p} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <PayslipFormModal
          payslip={editing}
          technicians={technicians}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {showBulkPay && (
        <BulkPayModal
          technicians={technicians}
          onClose={() => setShowBulkPay(false)}
          onSaved={() => {
            setShowBulkPay(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function BulkPayModal({
  technicians,
  onClose,
  onSaved,
}: {
  technicians: Technician[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const now = new Date();
  const [period, setPeriod] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [mode, setMode] = useState<"all" | "select">("all");
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: string[] } | null>(null);

  const activeTechnicians = technicians.filter((tc) => tc.active);

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "select" && selected.length === 0) {
      setError(t("payroll.bulk.selectAtLeastOne"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { period: `${period}-01` };
      if (mode === "select") payload.technician_ids = selected;
      const res = await apiFetch(`${API_URL}/api/payslips/bulk_generate/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Request failed (${res.status})`);
      }
      const body = await res.json();
      setResult({ created: body.created_count, skipped: body.skipped_names || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("payroll.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <Modal title={t("payroll.recordPayment")} onClose={onSaved}>
        <div className="dform-hint" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
          {t("payroll.bulk.resultCreated", { count: result.created })}
        </div>
        {result.skipped.length > 0 && (
          <p style={{ fontSize: 12.5, color: "var(--muted-foreground)", marginBottom: 14 }}>
            {t("payroll.bulk.resultSkipped", { count: result.skipped.length, names: result.skipped.join(", ") })}
          </p>
        )}
        <div className="dform-actions">
          <button type="button" className="dbtn primary" onClick={onSaved}>{t("common.done")}</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={t("payroll.recordPayment")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="bulk-period">{t("payroll.field.period")}</label>
          <input id="bulk-period" type="month" required value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div className="dfield">
          <label>{t("payroll.bulk.recipients")}</label>
          <div style={{ display: "flex", gap: 14, marginTop: 4, marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: 13 }}>
              <input type="radio" name="bulk-mode" checked={mode === "all"} onChange={() => setMode("all")} />
              {t("payroll.bulk.allStaff", { count: activeTechnicians.length })}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: 13 }}>
              <input type="radio" name="bulk-mode" checked={mode === "select"} onChange={() => setMode("select")} />
              {t("payroll.bulk.selectStaff")}
            </label>
          </div>
          {mode === "select" && (
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 8 }}>
              {activeTechnicians.map((tc) => (
                <label key={tc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px", fontWeight: 400, fontSize: 13 }}>
                  <input type="checkbox" checked={selected.includes(tc.id)} onChange={() => toggle(tc.id)} />
                  {tc.name}
                  <span style={{ color: "var(--muted-foreground)", fontSize: 11.5 }}>{tc.role}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 4 }}>{t("payroll.bulk.hint")}</p>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : t("payroll.recordPayment")}</button>
        </div>
      </form>
    </Modal>
  );
}

function PayslipRow({ payslip, onEdit, onDelete }: { payslip: Payslip; onEdit: () => void; onDelete: () => void }) {
  const { t } = useLocale();
  const tech = payslip.technician;
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="davatar" style={{ width: 26, height: 26, fontSize: 10.5, ...initialsColor(tech.tint) }}>{tech.initials}</span>
          <div>
            <div style={{ fontWeight: 500 }}>{tech.name}</div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{tech.role}</div>
          </div>
        </div>
      </td>
      <td className="nw" style={{ color: "var(--muted-foreground)" }}>{formatPeriod(payslip.period)}</td>
      <td className="num tnum nw">{tzs(payslip.base_salary)}</td>
      <td className="num tnum nw" style={{ color: "var(--success)" }}>+{tzs(payslip.allowances)}</td>
      <td className="num tnum nw" style={{ color: "var(--destructive)" }}>-{tzs(payslip.deductions)}</td>
      <td className="num tnum nw" style={{ fontWeight: 600 }}>{tzs(payslip.net_pay)}</td>
      <td className="nw">
        <span className={`dbadge ${payslip.status === "paid" ? "success" : "neutral"}`}><i />{t(`enums.payslipStatus.${payslip.status}`)}</span>
      </td>
      <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(payslip.paid_date)}</td>
      <td className="num nw">
        <div className="dactions">
          <button className="dash-icon-btn" aria-label={t("payroll.editPayslip")} onClick={onEdit}><Icon name="edit" size={15} /></button>
          <button className="dash-icon-btn danger" aria-label={t("payroll.deletePayslip")} onClick={onDelete}><Icon name="trash" size={15} /></button>
        </div>
      </td>
    </tr>
  );
}

function PayslipFormModal({
  payslip,
  technicians,
  onClose,
  onSaved,
}: {
  payslip: Payslip | null;
  technicians: Technician[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<PayslipForm>(
    payslip
      ? {
          technician_id: String(payslip.technician.id),
          period: payslip.period.slice(0, 7),
          base_salary: payslip.base_salary,
          allowances: payslip.allowances,
          deductions: payslip.deductions,
          status: payslip.status,
          paid_date: payslip.paid_date || "",
        }
      : blankForm(technicians)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof PayslipForm>(key: K, value: PayslipForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = payslip ? `${API_URL}/api/payslips/${payslip.id}/` : `${API_URL}/api/payslips/`;
      const payload = {
        technician_id: Number(form.technician_id),
        period: `${form.period}-01`,
        base_salary: form.base_salary,
        allowances: form.allowances,
        deductions: form.deductions,
        status: form.status,
        paid_date: form.status === "paid" ? form.paid_date || null : null,
      };
      const res = await apiFetch(url, {
        method: payslip ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("payroll.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={payslip ? t("payroll.modal.editTitle") : t("payroll.modal.addTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="technician">{t("payroll.field.staffMember")}</label>
            <select
              id="technician"
              value={form.technician_id}
              onChange={(e) => {
                const tech = technicians.find((tc) => String(tc.id) === e.target.value);
                update("technician_id", e.target.value);
                if (tech && !payslip) update("base_salary", tech.monthly_salary);
              }}
            >
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="period">{t("payroll.field.period")}</label>
            <input id="period" type="month" required value={form.period} onChange={(e) => update("period", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="base_salary">{t("payroll.field.baseSalary")}</label>
            <input id="base_salary" type="number" min="0" step="1000" value={form.base_salary} onChange={(e) => update("base_salary", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="allowances">{t("payroll.field.allowances")}</label>
            <input id="allowances" type="number" min="0" step="1000" value={form.allowances} onChange={(e) => update("allowances", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="deductions">{t("payroll.field.deductions")}</label>
            <input id="deductions" type="number" min="0" step="1000" value={form.deductions} onChange={(e) => update("deductions", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="status">{t("payroll.field.status")}</label>
            <select id="status" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="draft">{t("enums.payslipStatus.draft")}</option>
              <option value="paid">{t("enums.payslipStatus.paid")}</option>
            </select>
          </div>
        </div>
        {form.status === "paid" && (
          <div className="dfield">
            <label htmlFor="paid_date">{t("payroll.field.paidOn")}</label>
            <input id="paid_date" type="date" value={form.paid_date} onChange={(e) => update("paid_date", e.target.value)} />
          </div>
        )}
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : payslip ? t("common.saveChanges") : t("payroll.form.submitAdd")}</button>
        </div>
      </form>
    </Modal>
  );
}
