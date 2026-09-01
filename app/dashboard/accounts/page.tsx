"use client";

import { useEffect, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useBranch } from "../branch/BranchContext";
import { useLocale } from "../i18n/LocaleContext";
import type { AuthUser, Branch, RoleDef, RoleKey } from "../types";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";
import { assignableRoles } from "../../lib/auth/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

function roleBadgeVariant(role: RoleKey) {
  if (role === "superadmin") return "danger";
  if (role === "admin") return "info";
  return "neutral";
}

function roleLabel(role: RoleKey, roles: RoleDef[], t: (k: string) => string) {
  if (role === "superadmin" || role === "admin") return t(`enums.role.${role}`);
  return roles.find((r) => r.key === role)?.name || role;
}

type AccountForm = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: RoleKey;
  branch: number | "";
  password: string;
  is_active: boolean;
};

function blankForm(defaultRole: RoleKey): AccountForm {
  return { username: "", email: "", first_name: "", last_name: "", phone: "", role: defaultRole, branch: "", password: "", is_active: true };
}

export default function AccountsPage() {
  const { t } = useLocale();
  const { user: me, roles } = useAuth();
  const { branches } = useBranch();
  const [accounts, setAccounts] = useState<AuthUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [showForm, setShowForm] = useState(false);

  const assignable = assignableRoles(me?.role, roles);

  function load() {
    apiFetch(`${API_URL}/api/accounts/`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      })
      .then((json) => setAccounts(json.results || json))
      .catch((err) => setError(err instanceof Error ? err.message : t("accounts.loadError")));
  }

  useEffect(load, []);

  async function handleDelete(a: AuthUser) {
    if (me && a.id === me.id) {
      window.alert(t("accounts.deleteBlockedSelf"));
      return;
    }
    if (!window.confirm(t("accounts.confirmDelete", { name: a.full_name || a.username }))) return;
    const res = await apiFetch(`${API_URL}/api/accounts/${a.id}/`, { method: "DELETE" });
    if (!res.ok) {
      window.alert(t("accounts.saveError"));
      return;
    }
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
  if (!accounts) return <div className="dstate">{t("accounts.loading")}</div>;

  return (
    <div className="dgrid">
      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("accounts.title")}</h3><p>{t("accounts.subtitle")}</p></div>
          {assignable.length > 0 && (
            <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Icon name="plus" />{t("accounts.addAccount")}
            </button>
          )}
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("accounts.col.name")}</th>
                  <th>{t("accounts.col.username")}</th>
                  <th>{t("accounts.col.role")}</th>
                  <th>{t("accounts.col.branch")}</th>
                  <th>{t("accounts.col.status")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.full_name || a.username}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>{a.username}</td>
                    <td className="nw">
                      <span className={`dbadge ${roleBadgeVariant(a.role)}`}><i />{roleLabel(a.role, roles, t)}</span>
                    </td>
                    <td style={{ color: "var(--muted-foreground)" }}>{a.branch ? a.branch.name : t("nav.allBranches")}</td>
                    <td className="nw">
                      <span className={`dbadge ${a.is_active ? "success" : "neutral"}`}><i />{a.is_active ? t("accounts.status.active") : t("accounts.status.inactive")}</span>
                    </td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("common.edit")} onClick={() => { setEditing(a); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("common.delete")} onClick={() => handleDelete(a)}>
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
        <AccountFormModal
          account={editing}
          branches={branches}
          roles={roles}
          assignableRoles={assignable}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function AccountFormModal({
  account,
  branches,
  roles,
  assignableRoles: assignable,
  onClose,
  onSaved,
}: {
  account: AuthUser | null;
  branches: Branch[];
  roles: RoleDef[];
  assignableRoles: RoleKey[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<AccountForm>(
    account
      ? {
          username: account.username, email: account.email, first_name: account.first_name, last_name: account.last_name,
          phone: account.phone, role: account.role, branch: account.branch?.id ?? "", password: "", is_active: account.is_active,
        }
      : blankForm(assignable[0] || "sales")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof AccountForm>(key: K, value: AccountForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        username: form.username, email: form.email, first_name: form.first_name, last_name: form.last_name,
        phone: form.phone, role: form.role, branch: form.branch === "" ? null : form.branch, is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;
      const url = account ? `${API_URL}/api/accounts/${account.id}/` : `${API_URL}/api/accounts/`;
      const res = await apiFetch(url, {
        method: account ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 403) throw new Error(t("accounts.roleBlocked"));
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("accounts.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={account ? t("accounts.form.editTitle", { name: account.full_name || account.username }) : t("accounts.form.addTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="a-first">{t("accounts.field.firstName")}</label>
            <input id="a-first" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="a-last">{t("accounts.field.lastName")}</label>
            <input id="a-last" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="a-username">{t("accounts.field.username")}</label>
            <input id="a-username" required value={form.username} onChange={(e) => update("username", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="a-email">{t("accounts.field.email")}</label>
            <input id="a-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="a-phone">{t("accounts.field.phone")}</label>
            <input id="a-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="a-role">{t("accounts.field.role")}</label>
            <select id="a-role" value={form.role} onChange={(e) => update("role", e.target.value)}>
              {assignable.map((r) => (
                <option key={r} value={r}>{roleLabel(r, roles, t)}</option>
              ))}
              {account && !assignable.includes(account.role) && (
                <option value={account.role}>{roleLabel(account.role, roles, t)}</option>
              )}
            </select>
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="a-branch">{t("accounts.field.branch")}</label>
          <select id="a-branch" value={form.branch} onChange={(e) => update("branch", e.target.value ? Number(e.target.value) : "")}>
            <option value="">{t("accounts.field.branchNone")}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="dfield">
          <label htmlFor="a-password">{t("accounts.field.password")}</label>
          <input
            id="a-password"
            type="password"
            autoComplete="new-password"
            required={!account}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
          <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>
            {account ? t("accounts.field.passwordHintEdit") : t("accounts.field.passwordHintCreate")}
          </span>
        </div>
        <div className="dfield-check">
          <input id="a-active" type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
          <label htmlFor="a-active" style={{ margin: 0 }}>{t("accounts.field.active")}</label>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : account ? t("common.saveChanges") : t("accounts.addAccount")}</button>
        </div>
      </form>
    </Modal>
  );
}
