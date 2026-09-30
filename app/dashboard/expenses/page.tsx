"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { useBranch } from "../branch/BranchContext";
import type { Branch, Expense, ExpensesSummary, Technician } from "../types";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const CATEGORIES = [
  { value: "fuel_transport", label: "Fuel & Transport" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "marketing", label: "Marketing" },
  { value: "maintenance", label: "Equipment Maintenance" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
];

function initialsColor(tint: number) {
  const n = ((tint - 1) % 6) + 1;
  return { background: `var(--tint-${n})`, color: `var(--tint-${n}-fg)` };
}

function tzs(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `TZS ${Math.round(n).toLocaleString("en-US")}`;
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type ExpenseForm = {
  category: string;
  description: string;
  amount: string;
  expense_date: string;
  payment_method: string;
  recorded_by_id: string;
  branch_id: string;
};

function blankForm(technicians: Technician[], branches: Branch[], branchId: string): ExpenseForm {
  const defaultBranchId =
    branchId !== "all" ? branchId : branches[0] ? String(branches[0].id) : "";
  return {
    category: "other",
    description: "",
    amount: "0",
    expense_date: new Date().toISOString().slice(0, 10),
    payment_method: "cash",
    recorded_by_id: technicians[0] ? String(technicians[0].id) : "",
    branch_id: defaultBranchId,
  };
}

export default function ExpensesPage() {
  const { t } = useLocale();
  const { branchId } = useBranch();
  const [data, setData] = useState<ExpensesSummary | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fCategory, setFCategory] = useState("");
  const [fMethod, setFMethod] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  const branchIdRef = useRef(branchId);
  useEffect(() => {
    branchIdRef.current = branchId;
  }, [branchId]);

  function load() {
    const requestBranch = branchId;
    Promise.all([
      apiFetch(`${API_URL}/api/expenses/summary/?branch=${branchId}`).then((r) => {
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
        setError(err instanceof Error ? err.message : t("expenses.loadError"));
      });
  }

  useEffect(load, [branchId]);

  async function handleDelete(e: Expense) {
    if (!window.confirm(t("expenses.deleteConfirm", { description: e.description }))) return;
    await apiFetch(`${API_URL}/api/expenses/${e.id}/`, { method: "DELETE" });
    load();
  }

  const allExpenses = useMemo(() => data?.expenses ?? [], [data]);
  const filtered = useMemo(() => {
    return allExpenses.filter((e) => {
      if (fCategory && e.category !== fCategory) return false;
      if (fMethod && e.payment_method !== fMethod) return false;
      if (fFrom && e.expense_date < fFrom) return false;
      if (fTo && e.expense_date > fTo) return false;
      return true;
    });
  }, [allExpenses, fCategory, fMethod, fFrom, fTo]);
  const hasFilters = Boolean(fCategory || fMethod || fFrom || fTo);
  function clearFilters() { setFCategory(""); setFMethod(""); setFFrom(""); setFTo(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("expenses.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("expenses.kpi.totalThisMonth"), v: tzs(data.kpis.total_this_month), icon: "wallet", color: "var(--chart-2)" },
    { l: t("expenses.kpi.loggedCount"), v: String(data.kpis.count_this_month), icon: "check-square", color: "var(--chart-5)" },
    { l: t("expenses.kpi.topCategory"), v: data.category_breakdown[0] ? t(`enums.expenseCategory.${data.category_breakdown[0].category}`) : "—", icon: "target", color: "var(--warning-foreground)" },
    { l: t("expenses.kpi.allTimeEntries"), v: String(data.kpis.total_expenses), icon: "folder", color: "var(--muted-foreground)" },
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
            <p className="v tnum" style={{ color: k.color, fontSize: 20 }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("expenses.title")}</h3><p>{t("expenses.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("expenses.addExpense")}
          </button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="ef-category">{t("expenses.category")}</label>
            <select id="ef-category" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
              <option value="">{t("common.allCategories")}</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{t(`enums.expenseCategory.${c.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="ef-method">{t("expenses.payment")}</label>
            <select id="ef-method" value={fMethod} onChange={(e) => setFMethod(e.target.value)}>
              <option value="">{t("expenses.allPaymentMethods")}</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{t(`enums.paymentMethod.${m.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="ef-from">{t("expenses.from")}</label>
            <input id="ef-from" type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} />
          </div>
          <div className="fgroup">
            <label htmlFor="ef-to">{t("expenses.to")}</label>
            <input id="ef-to" type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} />
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allExpenses.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("expenses.description")}</th>
                  <th>{t("expenses.category")}</th>
                  <th className="num">{t("expenses.amount")}</th>
                  <th>{t("expenses.payment")}</th>
                  <th>{t("expenses.recordedBy")}</th>
                  {branchId === "all" && <th>{t("nav.branch")}</th>}
                  <th className="num">{t("expenses.date")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500 }}>{e.description}</td>
                    <td className="nw"><span className="dtag">{t(`enums.expenseCategory.${e.category}`)}</span></td>
                    <td className="num tnum nw" style={{ fontWeight: 600, color: "var(--destructive)" }}>-{tzs(e.amount)}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>{t(`enums.paymentMethod.${e.payment_method}`)}</td>
                    <td className="nw">
                      {e.recorded_by ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="davatar" style={initialsColor(e.recorded_by.tint)}>{e.recorded_by.initials}</span>
                          {e.recorded_by.name}
                        </div>
                      ) : "—"}
                    </td>
                    {branchId === "all" && (
                      <td className="nw" style={{ color: "var(--muted-foreground)" }}>{e.branch?.name || "—"}</td>
                    )}
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(e.expense_date)}</td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("expenses.editAriaLabel")} onClick={() => { setEditing(e); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("expenses.deleteAriaLabel")} onClick={() => handleDelete(e)}>
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
        <ExpenseFormModal
          expense={editing}
          technicians={technicians}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function ExpenseFormModal({
  expense,
  technicians,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  technicians: Technician[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const { hasRole } = useAuth();
  const { branches, branchId } = useBranch();
  const canPickBranch = hasRole("superadmin", "admin");
  const [form, setForm] = useState<ExpenseForm>(
    expense
      ? {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        expense_date: expense.expense_date,
        payment_method: expense.payment_method,
        recorded_by_id: expense.recorded_by ? String(expense.recorded_by.id) : "",
        branch_id: expense.branch ? String(expense.branch.id) : "",
      }
      : blankForm(technicians, branches, branchId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = expense ? `${API_URL}/api/expenses/${expense.id}/` : `${API_URL}/api/expenses/`;
      const payload = {
        category: form.category,
        description: form.description,
        amount: form.amount,
        expense_date: form.expense_date,
        payment_method: form.payment_method,
        recorded_by_id: form.recorded_by_id ? Number(form.recorded_by_id) : null,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
      };
      const res = await apiFetch(url, {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={expense ? "Edit Expense" : "Add Expense"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="e-desc">Description</label>
          <input id="e-desc" required value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="e-category">Category</label>
            <select id="e-category" value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="e-amount">Amount (TZS)</label>
            <input id="e-amount" type="number" min="0" step="1000" value={form.amount} onChange={(e) => update("amount", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="e-method">Payment method</label>
            <select id="e-method" value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="e-date">Date</label>
            <input id="e-date" type="date" required value={form.expense_date} onChange={(e) => update("expense_date", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="e-branch">{t("nav.branch")}</label>
            {canPickBranch ? (
              <select id="e-branch" required value={form.branch_id} onChange={(e) => update("branch_id", e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <input id="e-branch" value={branches.find((b) => String(b.id) === form.branch_id)?.name ?? ""} disabled readOnly />
            )}
          </div>
          <div className="dfield">
            <label htmlFor="e-recorded">Recorded by</label>
            <select id="e-recorded" value={form.recorded_by_id} onChange={(e) => update("recorded_by_id", e.target.value)}>
              <option value="">— None —</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>Cancel</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? "Saving…" : expense ? "Save changes" : "Add expense"}</button>
        </div>
      </form>
    </Modal>
  );
}
