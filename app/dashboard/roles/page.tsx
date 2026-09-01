"use client";

import { useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import type { RoleDef } from "../types";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";
import { ALLOWED_MODULES } from "../../lib/auth/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

const MODULE_LABEL_KEYS: Record<string, string> = {
  dashboard: "nav.item.dashboard",
  branches: "nav.item.branches",
  jobs: "nav.item.jobs",
  leads: "nav.item.leads",
  customers: "nav.item.customers",
  staff: "nav.item.users",
  payroll: "nav.item.payroll",
  finance: "nav.item.finance",
  sales: "nav.item.sales",
  purchases: "nav.item.purchases",
  inventory: "nav.item.inventory",
  expenses: "nav.item.expenses",
  suppliers: "nav.item.suppliers",
  categories: "roles.module.categories",
};

type RoleForm = { key: string; name: string; modules: string[] };

function blankForm(): RoleForm {
  return { key: "", name: "", modules: [] };
}

export default function RolesPage() {
  const { t } = useLocale();
  const { roles, refreshRoles } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RoleDef | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(role: RoleDef) {
    if (!window.confirm(t("roles.confirmDelete", { name: role.name }))) return;
    const res = await apiFetch(`${API_URL}/api/roles/${role.id}/`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.detail || t("roles.deleteBlocked"));
      return;
    }
    refreshRoles();
  }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }

  return (
    <div className="dgrid">
      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("roles.title")}</h3><p>{t("roles.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("roles.addRole")}
          </button>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("roles.col.name")}</th>
                  <th>{t("roles.col.key")}</th>
                  <th>{t("roles.col.modules")}</th>
                  <th>{t("roles.col.accounts")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td className="nw tnum" style={{ color: "var(--muted-foreground)" }}>{r.key}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {r.modules.length === 0 && <span style={{ color: "var(--muted-foreground)" }}>—</span>}
                        {r.modules.map((m) => (
                          <span key={m} className="dtag">{t(MODULE_LABEL_KEYS[m] || m)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="tnum nw">{r.users_count}</td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("common.edit")} onClick={() => { setEditing(r); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("common.delete")} onClick={() => handleDelete(r)}>
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
        <RoleFormModal
          role={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refreshRoles(); }}
        />
      )}
    </div>
  );
}

function RoleFormModal({
  role,
  onClose,
  onSaved,
}: {
  role: RoleDef | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<RoleForm>(role ? { key: role.key, name: role.name, modules: role.modules } : blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModule(module: string) {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(module) ? f.modules.filter((m) => m !== module) : [...f.modules, module],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = role ? { name: form.name, modules: form.modules } : form;
      const url = role ? `${API_URL}/api/roles/${role.id}/` : `${API_URL}/api/roles/`;
      const res = await apiFetch(url, { method: role ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("roles.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={role ? t("roles.form.editTitle", { name: role.name }) : t("roles.addRole")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="r-name">{t("roles.field.name")}</label>
            <input id="r-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="dfield">
            <label htmlFor="r-key">{t("roles.field.key")}</label>
            <input
              id="r-key"
              required
              disabled={Boolean(role)}
              placeholder={t("roles.field.keyPlaceholder")}
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
            />
          </div>
        </div>
        <div className="dfield">
          <label>{t("roles.field.modules")}</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 4 }}>
            {ALLOWED_MODULES.map((m) => (
              <label key={m} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 400 }}>
                <input type="checkbox" checked={form.modules.includes(m)} onChange={() => toggleModule(m)} />
                {t(MODULE_LABEL_KEYS[m] || m)}
              </label>
            ))}
          </div>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : role ? t("common.saveChanges") : t("roles.addRole")}</button>
        </div>
      </form>
    </Modal>
  );
}
