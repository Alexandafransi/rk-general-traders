"use client";

import { useEffect, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import type { Supplier } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

type SupplierForm = {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  notes: string;
};

const BLANK_FORM: SupplierForm = { name: "", contact_person: "", phone: "", email: "", notes: "" };

export default function SuppliersPage() {
  const { t } = useLocale();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    apiFetch(`${API_URL}/api/suppliers/`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      })
      .then((json) => setSuppliers(json.results || json))
      .catch((err) => setError(err instanceof Error ? err.message : t("suppliers.error.loadFailed")));
  }

  useEffect(load, []);

  async function handleDelete(s: Supplier) {
    if (!window.confirm(t("suppliers.deleteConfirm", { name: s.name }))) return;
    await apiFetch(`${API_URL}/api/suppliers/${s.id}/`, { method: "DELETE" });
    load();
  }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!suppliers) return <div className="dstate">{t("suppliers.loading")}</div>;

  return (
    <div className="dgrid">
      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("suppliers.title")}</h3><p>{t("suppliers.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("suppliers.addSupplier")}
          </button>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("suppliers.col.supplier")}</th>
                  <th>{t("suppliers.col.contactPerson")}</th>
                  <th>{t("suppliers.col.phone")}</th>
                  <th>{t("suppliers.col.email")}</th>
                  <th className="num">{t("suppliers.col.purchases")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ color: "var(--muted-foreground)" }}>{s.contact_person || "—"}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>{s.phone || "—"}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>{s.email || "—"}</td>
                    <td className="num tnum nw"><span className="dtag">{s.purchase_count}</span></td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("suppliers.editAria", { name: s.name })} onClick={() => { setEditing(s); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("suppliers.deleteAria", { name: s.name })} onClick={() => handleDelete(s)}>
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
        <SupplierFormModal
          supplier={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function SupplierFormModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<SupplierForm>(
    supplier
      ? { name: supplier.name, contact_person: supplier.contact_person, phone: supplier.phone, email: supplier.email, notes: supplier.notes }
      : BLANK_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof SupplierForm>(key: K, value: SupplierForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = supplier ? `${API_URL}/api/suppliers/${supplier.id}/` : `${API_URL}/api/suppliers/`;
      const res = await apiFetch(url, {
        method: supplier ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("suppliers.error.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={supplier ? t("suppliers.form.editTitle", { name: supplier.name }) : t("suppliers.form.addTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="s-name">{t("suppliers.form.name")}</label>
          <input id="s-name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="s-contact">{t("suppliers.form.contactPerson")}</label>
            <input id="s-contact" value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="s-phone">{t("suppliers.form.phone")}</label>
            <input id="s-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="s-email">{t("suppliers.form.email")}</label>
          <input id="s-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="dfield">
          <label htmlFor="s-notes">{t("suppliers.form.notes")}</label>
          <textarea id="s-notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : supplier ? t("common.saveChanges") : t("suppliers.form.addSupplier")}</button>
        </div>
      </form>
    </Modal>
  );
}
