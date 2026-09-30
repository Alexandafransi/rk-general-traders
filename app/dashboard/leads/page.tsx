"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { useBranch } from "../branch/BranchContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";
import type { Lead, LeadsSummary } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const INTERESTS = [
  { value: "fiber_installation", label: "Fiber Installation" },
  { value: "router_setup", label: "Router Setup" },
  { value: "wifi_extender", label: "Wi-Fi Extender" },
  { value: "mikrotik_voucher", label: "Mikrotik Voucher System" },
  { value: "access_point", label: "Access Point" },
  { value: "fiber_onu_ont", label: "Fiber ONU/ONT" },
  { value: "power_backup", label: "Power Backup (UPS)" },
  { value: "support", label: "Maintenance & Support" },
];

const SOURCES = [
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone Call" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk-in" },
];

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const STATUS_BADGE: Record<string, string> = {
  new: "info",
  contacted: "warning",
  quoted: "warning",
  converted: "success",
  lost: "danger",
};

const SOURCE_COLOR: Record<string, string> = {
  website: "var(--chart-1)",
  whatsapp: "var(--chart-2)",
  phone: "var(--chart-3)",
  referral: "var(--chart-5)",
  walk_in: "var(--chart-6)",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type LeadForm = {
  name: string;
  phone: string;
  email: string;
  location: string;
  interest: string;
  source: string;
  status: string;
  notes: string;
  branch_id: string;
};

function blankForm(defaultBranchId: string): LeadForm {
  return { name: "", phone: "", email: "", location: "", interest: "router_setup", source: "website", status: "new", notes: "", branch_id: defaultBranchId };
}

export default function LeadsPage() {
  const { t } = useLocale();
  const { branchId } = useBranch();
  const [data, setData] = useState<LeadsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fStatus, setFStatus] = useState("");
  const [fSource, setFSource] = useState("");
  const [fInterest, setFInterest] = useState("");

  const branchIdRef = useRef(branchId);
  useEffect(() => {
    branchIdRef.current = branchId;
  }, [branchId]);

  function load() {
    const requestBranch = branchId;
    apiFetch(`${API_URL}/api/leads/summary/?branch=${branchId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API responded ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (requestBranch !== branchIdRef.current) return;
        setData(json);
      })
      .catch((err) => {
        if (requestBranch !== branchIdRef.current) return;
        setError(err instanceof Error ? err.message : t("leads.failedToLoad"));
      });
  }

  useEffect(load, [branchId]);

  async function handleDelete(l: Lead) {
    if (!window.confirm(t("leads.confirmDelete", { name: l.name }))) return;
    await apiFetch(`${API_URL}/api/leads/${l.id}/`, { method: "DELETE" });
    load();
  }

  const allLeads = useMemo(() => data?.leads ?? [], [data]);
  const filtered = useMemo(() => {
    return allLeads.filter((l) => {
      if (fStatus && l.status !== fStatus) return false;
      if (fSource && l.source !== fSource) return false;
      if (fInterest && l.interest !== fInterest) return false;
      return true;
    });
  }, [allLeads, fStatus, fSource, fInterest]);
  const hasFilters = Boolean(fStatus || fSource || fInterest);
  function clearFilters() { setFStatus(""); setFSource(""); setFInterest(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("leads.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("leads.kpi.totalLeads"), v: String(data.kpis.total_leads), icon: "target", color: "var(--chart-1)" },
    { l: t("leads.kpi.newThisMonth"), v: String(data.kpis.new_this_month), icon: "flag", color: "var(--chart-5)" },
    { l: t("leads.kpi.openLeads"), v: String(data.kpis.open_leads), icon: "clock", color: "var(--warning-foreground)" },
    { l: t("leads.kpi.conversionRate"), v: `${data.kpis.conversion_rate}%`, icon: "check-square", color: "var(--success)" },
  ];

  const maxSourceCount = Math.max(...data.source_breakdown.map((s) => s.count), 1);

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

      <div className="dcard dc7" style={{ marginBottom: "var(--card-gap)" }}>
        <div className="dcard-hd"><div><h3>{t("leads.bySource.title")}</h3><p>{t("leads.bySource.subtitle")}</p></div></div>
        <div className="dcard-bd" style={{ paddingTop: 6, gap: 14 }}>
          {data.source_breakdown.map((s) => {
            const pct = Math.round((s.count / maxSourceCount) * 100);
            const rate = s.count ? Math.round((s.converted / s.count) * 100) : 0;
            return (
              <div key={s.source}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: SOURCE_COLOR[s.source] || "var(--muted)" }} />
                    {t(`enums.leadSource.${s.source}`)}
                  </span>
                  <span style={{ color: "var(--muted-foreground)" }} className="tnum">
                    {t("leads.bySource.stat", { count: s.count, converted: s.converted, rate })}
                  </span>
                </div>
                <span className="dmeter" style={{ height: 6, display: "block" }}>
                  <i style={{ width: `${pct}%`, background: SOURCE_COLOR[s.source] || "var(--muted)" }} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dcard dc5" style={{ marginBottom: "var(--card-gap)" }}>
        <div className="dcard-hd"><div><h3>{t("leads.byStatus.title")}</h3><p>{t("leads.byStatus.subtitle")}</p></div></div>
        <div className="dcard-bd" style={{ paddingTop: 6, gap: 10 }}>
          {data.status_breakdown.map((s) => (
            <div key={s.status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
              <span className={`dbadge ${STATUS_BADGE[s.status] || "neutral"}`}><i />{t(`enums.leadStatus.${s.status}`)}</span>
              <b className="tnum">{s.count}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("leads.table.title")}</h3><p>{t("leads.table.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("leads.addLead")}
          </button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="lf-status">{t("leads.filter.status")}</label>
            <select id="lf-status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">{t("common.allStatuses")}</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{t(`enums.leadStatus.${s.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="lf-source">{t("leads.filter.source")}</label>
            <select id="lf-source" value={fSource} onChange={(e) => setFSource(e.target.value)}>
              <option value="">{t("leads.filter.allSources")}</option>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{t(`enums.leadSource.${s.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="lf-interest">{t("leads.filter.interest")}</label>
            <select id="lf-interest" value={fInterest} onChange={(e) => setFInterest(e.target.value)}>
              <option value="">{t("leads.filter.allInterests")}</option>
              {INTERESTS.map((i) => (
                <option key={i.value} value={i.value}>{t(`enums.serviceCategory.${i.value}`)}</option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allLeads.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("leads.col.name")}</th>
                  <th>{t("leads.col.contact")}</th>
                  <th>{t("leads.col.location")}</th>
                  <th>{t("leads.col.interest")}</th>
                  <th>{t("leads.col.source")}</th>
                  <th>{t("leads.col.status")}</th>
                  {branchId === "all" && <th>{t("nav.branch")}</th>}
                  <th className="num">{t("leads.col.created")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>{l.name}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>
                      <div>{l.phone || "—"}</div>
                      <div style={{ fontSize: 11 }}>{l.email}</div>
                    </td>
                    <td style={{ color: "var(--muted-foreground)" }}>{l.location || "—"}</td>
                    <td className="nw"><span className="dtag">{t(`enums.serviceCategory.${l.interest}`)}</span></td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>{t(`enums.leadSource.${l.source}`)}</td>
                    <td className="nw"><span className={`dbadge ${STATUS_BADGE[l.status] || "neutral"}`}><i />{t(`enums.leadStatus.${l.status}`)}</span></td>
                    {branchId === "all" && (
                      <td className="nw" style={{ color: "var(--muted-foreground)" }}>{l.branch?.name || "—"}</td>
                    )}
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(l.created_at)}</td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("leads.editAria")} onClick={() => { setEditing(l); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("leads.deleteAria")} onClick={() => handleDelete(l)}>
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
        <LeadFormModal
          lead={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function LeadFormModal({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const { hasRole } = useAuth();
  const { branches, branchId } = useBranch();
  const canPickBranch = hasRole("superadmin", "admin");
  const defaultBranchId = branchId !== "all" ? branchId : String(branches[0]?.id ?? "");
  const [form, setForm] = useState<LeadForm>(
    lead
      ? {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          location: lead.location,
          interest: lead.interest,
          source: lead.source,
          status: lead.status,
          notes: lead.notes,
          branch_id: String(lead.branch?.id ?? defaultBranchId),
        }
      : blankForm(defaultBranchId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof LeadForm>(key: K, value: LeadForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = lead ? `${API_URL}/api/leads/${lead.id}/` : `${API_URL}/api/leads/`;
      const res = await apiFetch(url, {
        method: lead ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("leads.failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={lead ? t("leads.editLead", { name: lead.name }) : t("leads.addLead")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="l-name">{t("leads.field.fullName")}</label>
          <input id="l-name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="l-phone">{t("leads.field.phone")}</label>
            <input id="l-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="l-email">{t("leads.field.email")}</label>
            <input id="l-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="l-location">{t("leads.field.location")}</label>
          <input id="l-location" placeholder={t("leads.field.locationPlaceholder")} value={form.location} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div className="dfield">
          <label htmlFor="l-branch">{t("nav.branch")}</label>
          {canPickBranch ? (
            <select id="l-branch" required value={form.branch_id} onChange={(e) => update("branch_id", e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
          ) : (
            <input id="l-branch" value={branches.find((b) => String(b.id) === form.branch_id)?.name ?? ""} disabled readOnly />
          )}
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="l-interest">{t("leads.field.interestedIn")}</label>
            <select id="l-interest" value={form.interest} onChange={(e) => update("interest", e.target.value)}>
              {INTERESTS.map((i) => (
                <option key={i.value} value={i.value}>{t(`enums.serviceCategory.${i.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="l-source">{t("leads.field.sourceCampaign")}</label>
            <select id="l-source" value={form.source} onChange={(e) => update("source", e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{t(`enums.leadSource.${s.value}`)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="l-status">{t("leads.field.status")}</label>
          <select id="l-status" value={form.status} onChange={(e) => update("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{t(`enums.leadStatus.${s.value}`)}</option>
            ))}
          </select>
        </div>
        <div className="dfield">
          <label htmlFor="l-notes">{t("leads.field.notes")}</label>
          <input id="l-notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : lead ? t("common.saveChanges") : t("leads.addLeadSubmit")}</button>
        </div>
      </form>
    </Modal>
  );
}
