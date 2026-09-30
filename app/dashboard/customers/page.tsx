"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import type { Customer, CustomerRow, CustomersSummary } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const SOURCE_BADGE: Record<string, string> = { manual: "neutral", sale: "success", job: "info" };

function tzs(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `TZS ${Math.round(n).toLocaleString("en-US")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type CustomerForm = { name: string; phone: string; email: string; location: string; notes: string };

function blankForm(): CustomerForm {
  return { name: "", phone: "", email: "", location: "", notes: "" };
}

export default function CustomersPage() {
  const { t } = useLocale();
  const [data, setData] = useState<CustomersSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fSource, setFSource] = useState("");
  const [fSearch, setFSearch] = useState("");

  function load() {
    apiFetch(`${API_URL}/api/customers/summary/`)
      .then((r) => {
        if (!r.ok) throw new Error(`API responded ${r.status}`);
        return r.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load customers"));
  }

  useEffect(load, []);

  async function handleDelete(c: CustomerRow) {
    if (!window.confirm(t("customers.confirmDelete", { name: c.name }))) return;
    await apiFetch(`${API_URL}/api/customers/${c.id}/`, { method: "DELETE" });
    load();
  }

  const allCustomers = useMemo(() => data?.customers ?? [], [data]);
  const filtered = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    return allCustomers.filter((c) => {
      if (fSource && c.source !== fSource) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.location.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allCustomers, fSource, fSearch]);
  const hasFilters = Boolean(fSource || fSearch);
  function clearFilters() { setFSource(""); setFSearch(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("customers.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("customers.kpi.total"), v: String(data.kpis.total_customers), icon: "users", color: "var(--chart-1)" },
    { l: t("customers.kpi.newThisMonth"), v: String(data.kpis.new_this_month), icon: "flag", color: "var(--chart-5)" },
    { l: t("customers.kpi.autoAdded"), v: String(data.kpis.auto_count), icon: "check-square", color: "var(--success)" },
    { l: t("customers.kpi.manualAdded"), v: String(data.kpis.manual_count), icon: "tool", color: "var(--muted-foreground)" },
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
          <div>
            <h3>{t("customers.directory.title")}</h3>
            <p>{t("customers.directory.subtitle")}</p>
          </div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("customers.addCustomer")}
          </button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="cf-search">{t("common.search")}</label>
            <input id="cf-search" type="search" placeholder={t("customers.filter.searchPlaceholder")} value={fSearch} onChange={(e) => setFSearch(e.target.value)} />
          </div>
          <div className="fgroup">
            <label htmlFor="cf-source">{t("customers.filter.addedVia")}</label>
            <select id="cf-source" value={fSource} onChange={(e) => setFSource(e.target.value)}>
              <option value="">{t("customers.filter.allSources")}</option>
              <option value="manual">{t("enums.customerSource.manual")}</option>
              <option value="sale">{t("enums.customerSource.sale")}</option>
              <option value="job">{t("enums.customerSource.job")}</option>
            </select>
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allCustomers.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("customers.table.name")}</th>
                  <th>{t("customers.table.contact")}</th>
                  <th>{t("customers.table.location")}</th>
                  <th>{t("customers.filter.addedVia")}</th>
                  <th className="num">{t("customers.table.sales")}</th>
                  <th className="num">{t("customers.table.totalPaid")}</th>
                  <th className="num">{t("customers.table.jobs")}</th>
                  <th className="num">{t("customers.table.since")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>
                      <div>{c.phone || "—"}</div>
                      <div style={{ fontSize: 11 }}>{c.email}</div>
                    </td>
                    <td style={{ color: "var(--muted-foreground)" }}>{c.location || "—"}</td>
                    <td className="nw"><span className={`dbadge ${SOURCE_BADGE[c.source] || "neutral"}`}><i />{t(`enums.customerSource.${c.source}`)}</span></td>
                    <td className="num tnum nw">{c.sales_count}</td>
                    <td className="num tnum nw" style={{ fontWeight: 600 }}>{tzs(c.total_paid)}</td>
                    <td className="num tnum nw">{c.jobs_count}</td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(c.created_at)}</td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("customers.editAria")} onClick={() => { setEditing(c); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("customers.deleteAria")} onClick={() => handleDelete(c)}>
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
        <CustomerFormModal
          customer={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<CustomerForm>(
    customer
      ? { name: customer.name, phone: customer.phone, email: customer.email, location: customer.location, notes: customer.notes }
      : blankForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = customer ? `${API_URL}/api/customers/${customer.id}/` : `${API_URL}/api/customers/`;
      const res = await apiFetch(url, {
        method: customer ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={customer ? t("customers.modal.editTitle", { name: customer.name }) : t("customers.addCustomer")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="c-name">{t("customers.form.fullName")}</label>
          <input id="c-name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="c-phone">{t("customers.form.phone")}</label>
            <input id="c-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="c-email">{t("customers.form.email")}</label>
            <input id="c-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="c-location">{t("customers.form.location")}</label>
          <input id="c-location" placeholder={t("customers.form.locationPlaceholder")} value={form.location} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div className="dfield">
          <label htmlFor="c-notes">{t("customers.form.notes")}</label>
          <input id="c-notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : customer ? t("common.saveChanges") : t("customers.addCustomer")}</button>
        </div>
      </form>
    </Modal>
  );
}
