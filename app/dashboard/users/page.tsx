"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";
import type { RoleDef, Technician, UsersSummary } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function initialsColor(tint: number) {
  const n = ((tint - 1) % 6) + 1;
  return { background: `var(--tint-${n})`, color: `var(--tint-${n}-fg)` };
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type UserForm = {
  name: string;
  role: string;
  access_role: string;
  email: string;
  phone: string;
  tint: number;
  monthly_salary: string;
  active: boolean;
};

const BLANK_FORM: UserForm = {
  name: "",
  role: "Field Technician",
  access_role: "",
  email: "",
  phone: "",
  tint: 1,
  monthly_salary: "0",
  active: true,
};

export default function UsersPage() {
  const { t } = useLocale();
  const { roles } = useAuth();
  const [data, setData] = useState<UsersSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fAccessRole, setFAccessRole] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSearch, setFSearch] = useState("");

  function load() {
    apiFetch(`${API_URL}/api/users/summary/`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err instanceof Error ? err.message : t("users.loadError")));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(u: Technician) {
    setEditing(u);
    setShowForm(true);
  }

  async function handleDelete(u: Technician) {
    if (!window.confirm(t("users.deleteConfirm", { name: u.name }))) return;
    await apiFetch(`${API_URL}/api/technicians/${u.id}/`, { method: "DELETE" });
    load();
  }

  const allUsers = useMemo(() => data?.users ?? [], [data]);
  const filtered = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (fAccessRole && u.access_role !== fAccessRole) return false;
      if (fStatus && (fStatus === "active") !== u.active) return false;
      if (q && !u.name.toLowerCase().includes(q) && !u.role.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allUsers, fAccessRole, fStatus, fSearch]);
  const hasFilters = Boolean(fAccessRole || fStatus || fSearch);
  function clearFilters() { setFAccessRole(""); setFStatus(""); setFSearch(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("users.loading")}</div>;

  const kpis: { l: string; v: number; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("users.kpi.totalStaff"), v: data.kpis.total_users, icon: "users", color: "var(--chart-1)" },
    { l: t("users.kpi.active"), v: data.kpis.active_users, icon: "check-square", color: "var(--success)" },
    { l: t("users.kpi.inactive"), v: data.kpis.inactive_users, icon: "life", color: "var(--muted-foreground)" },
    { l: t("users.kpi.withLogin"), v: data.kpis.with_login, icon: "key", color: "var(--chart-2)" },
  ];

  return (
    <div className="dgrid">
      <div className="dgrid" style={{ gridColumn: "span 12", marginBottom: "var(--card-gap)" }}>
        {kpis.map((k) => (
          <div key={k.l} className="dcard dkpi" style={{ padding: "var(--card-pad)", gridColumn: "span 3" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <p className="l">{k.l}</p>
              <span style={{ color: "var(--muted-foreground)" }}><Icon name={k.icon} /></span>
            </div>
            <p className="v tnum" style={{ color: k.color }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("users.directory.title")}</h3><p>{t("users.directory.subtitle")}</p></div>
          <button className="dbtn primary" onClick={openCreate}><Icon name="plus" />{t("users.addUser")}</button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="uf-search">{t("common.search")}</label>
            <input id="uf-search" type="search" placeholder={t("users.filter.searchPlaceholder")} value={fSearch} onChange={(e) => setFSearch(e.target.value)} />
          </div>
          <div className="fgroup">
            <label htmlFor="uf-role">{t("users.filter.accessRole")}</label>
            <select id="uf-role" value={fAccessRole} onChange={(e) => setFAccessRole(e.target.value)}>
              <option value="">{t("users.filter.allRoles")}</option>
              {roles.map((r) => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="uf-status">{t("users.filter.status")}</label>
            <select id="uf-status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">{t("common.allStatuses")}</option>
              <option value="active">{t("users.status.active")}</option>
              <option value="inactive">{t("users.status.inactive")}</option>
            </select>
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allUsers.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("users.table.name")}</th>
                  <th>{t("users.table.jobTitle")}</th>
                  <th>{t("users.table.accessRole")}</th>
                  <th>{t("users.table.login")}</th>
                  <th>{t("users.table.contact")}</th>
                  <th>{t("users.table.joined")}</th>
                  <th>{t("users.table.status")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow key={u.id} user={u} onEdit={() => openEdit(u)} onDelete={() => handleDelete(u)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <UserFormModal
          user={editing}
          roles={roles}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function UserRow({ user, onEdit, onDelete }: { user: Technician; onEdit: () => void; onDelete: () => void }) {
  const { t } = useLocale();
  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="davatar" style={{ width: 26, height: 26, fontSize: 10.5, ...initialsColor(user.tint) }}>{user.initials}</span>
          <span style={{ fontWeight: 500 }}>{user.name}</span>
        </div>
      </td>
      <td style={{ color: "var(--muted-foreground)" }}>{user.role}</td>
      <td className="nw">
        <span className="dbadge neutral"><i />{user.access_role_display || t("users.accessRole.none")}</span>
      </td>
      <td className="nw">
        {user.account_username ? (
          <span className="dbadge success"><i />{user.account_username}</span>
        ) : (
          <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{t("users.table.noLogin")}</span>
        )}
      </td>
      <td className="nw" style={{ color: "var(--muted-foreground)" }}>
        <div>{user.email || "—"}</div>
        <div style={{ fontSize: 11 }}>{user.phone}</div>
      </td>
      <td className="tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(user.date_joined)}</td>
      <td className="nw">
        <span className={`dbadge ${user.active ? "success" : "neutral"}`}><i />{user.active ? t("users.status.active") : t("users.status.inactive")}</span>
      </td>
      <td className="num nw">
        <div className="dactions">
          <button className="dash-icon-btn" aria-label={t("users.editAria", { name: user.name })} onClick={onEdit}><Icon name="edit" size={15} /></button>
          <button className="dash-icon-btn danger" aria-label={t("users.deleteAria", { name: user.name })} onClick={onDelete}><Icon name="trash" size={15} /></button>
        </div>
      </td>
    </tr>
  );
}

function UserFormModal({
  user,
  roles,
  onClose,
  onSaved,
}: {
  user: Technician | null;
  roles: RoleDef[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const hasAccount = Boolean(user?.account_username);
  const [form, setForm] = useState<UserForm>(
    user
      ? {
          name: user.name,
          role: user.role,
          access_role: user.access_role,
          email: user.email,
          phone: user.phone,
          tint: user.tint,
          monthly_salary: user.monthly_salary,
          active: user.active,
        }
      : BLANK_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof UserForm>(key: K, value: UserForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = user ? `${API_URL}/api/technicians/${user.id}/` : `${API_URL}/api/technicians/`;
      const res = await apiFetch(url, {
        method: user ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={user ? t("users.modal.editTitle", { name: user.name }) : t("users.modal.addTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        {hasAccount && <div className="dform-hint">{t("users.field.linkedHint", { username: user!.account_username! })}</div>}
        <div className="dfield">
          <label htmlFor="name">{t("users.field.fullName")}</label>
          <input id="name" required disabled={hasAccount} value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="role">{t("users.field.jobTitle")}</label>
            <input id="role" required value={form.role} onChange={(e) => update("role", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="access_role">{t("users.filter.accessRole")}</label>
            <select id="access_role" disabled={hasAccount} value={form.access_role} onChange={(e) => update("access_role", e.target.value)}>
              <option value="">{t("users.accessRole.none")}</option>
              {roles.map((r) => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
              {form.access_role && !roles.some((r) => r.key === form.access_role) && (
                <option value={form.access_role}>{user?.access_role_display || form.access_role}</option>
              )}
            </select>
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="email">{t("users.field.email")}</label>
            <input id="email" type="email" disabled={hasAccount} value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="phone">{t("users.field.phone")}</label>
            <input id="phone" disabled={hasAccount} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="salary">{t("users.field.monthlySalary")}</label>
            <input
              id="salary"
              type="number"
              min="0"
              step="1000"
              value={form.monthly_salary}
              onChange={(e) => update("monthly_salary", e.target.value)}
            />
          </div>
          <div className="dfield">
            <label htmlFor="tint">{t("users.field.avatarColor")}</label>
            <select id="tint" value={form.tint} onChange={(e) => update("tint", Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{t("users.field.colorOption", { n })}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="dfield-check">
          <input id="active" type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
          <label htmlFor="active" style={{ margin: 0 }}>{t("users.field.active")}</label>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : user ? t("common.saveChanges") : t("users.submit.add")}</button>
        </div>
      </form>
    </Modal>
  );
}
