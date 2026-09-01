"use client";

import { useEffect, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useBranch } from "../branch/BranchContext";
import { useLocale } from "../i18n/LocaleContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import type { Branch } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

type BranchForm = {
  name: string;
  location: string;
  phone: string;
  active: boolean;
};

const BLANK_FORM: BranchForm = { name: "", location: "", phone: "", active: true };

export default function BranchesPage() {
  const { t } = useLocale();
  const { refreshBranches } = useBranch();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    apiFetch(`${API_URL}/api/branches/`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      })
      .then((json) => setBranches(json.results || json))
      .catch((err) => setError(err instanceof Error ? err.message : t("branches.loadError")));
  }

  useEffect(load, []);

  async function handleDelete(b: Branch) {
    if (!window.confirm(t("branches.confirmDelete", { name: b.name }))) return;
    const res = await apiFetch(`${API_URL}/api/branches/${b.id}/`, { method: "DELETE" });
    if (!res.ok) {
      window.alert(t("branches.deleteBlocked"));
      return;
    }
    load();
    refreshBranches();
  }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!branches) return <div className="dstate">{t("branches.loading")}</div>;

  return (
    <div className="dgrid">
      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("branches.title")}</h3><p>{t("branches.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("branches.addBranch")}
          </button>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("branches.col.name")}</th>
                  <th>{t("branches.col.location")}</th>
                  <th>{t("branches.col.phone")}</th>
                  <th>{t("branches.col.status")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.name}</td>
                    <td style={{ color: "var(--muted-foreground)" }}>{b.location || "—"}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>{b.phone || "—"}</td>
                    <td className="nw">
                      <span className={`dbadge ${b.active ? "success" : "neutral"}`}><i />{b.active ? t("branches.status.active") : t("branches.status.inactive")}</span>
                    </td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("common.edit")} onClick={() => { setEditing(b); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("common.delete")} onClick={() => handleDelete(b)}>
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
        <BranchFormModal
          branch={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); refreshBranches(); }}
        />
      )}
    </div>
  );
}

function BranchFormModal({
  branch,
  onClose,
  onSaved,
}: {
  branch: Branch | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<BranchForm>(
    branch
      ? { name: branch.name, location: branch.location, phone: branch.phone, active: branch.active }
      : BLANK_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof BranchForm>(key: K, value: BranchForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = branch ? `${API_URL}/api/branches/${branch.id}/` : `${API_URL}/api/branches/`;
      const res = await apiFetch(url, {
        method: branch ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("branches.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={branch ? t("branches.form.editTitle", { name: branch.name }) : t("branches.addBranch")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="b-name">{t("branches.field.name")}</label>
          <input id="b-name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="b-location">{t("branches.field.location")}</label>
            <input id="b-location" placeholder={t("branches.field.locationPlaceholder")} value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="b-phone">{t("branches.field.phone")}</label>
            <input id="b-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>
        <div className="dfield-check">
          <input id="b-active" type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
          <label htmlFor="b-active" style={{ margin: 0 }}>{t("branches.field.active")}</label>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : branch ? t("common.saveChanges") : t("branches.addBranch")}</button>
        </div>
      </form>
    </Modal>
  );
}
