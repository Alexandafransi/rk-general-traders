"use client";

import { useEffect, useState } from "react";
import Icon from "../Icon";
import { useLocale } from "../i18n/LocaleContext";
import { useBranch } from "../branch/BranchContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import type { AuditLogPage } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

const MODEL_NAMES = [
  "Session", "Branch", "Technician", "Account", "Role", "Lead", "Job", "Todo", "Payslip",
  "Supplier", "Purchase", "Category", "Expense", "Sale", "Product", "Customer",
];

const ACTIONS = ["create", "update", "deleted", "login", "login_failed", "logout"];

const ACTION_BADGE: Record<string, string> = {
  create: "success", update: "info", deleted: "danger",
  login: "success", logout: "neutral", login_failed: "danger",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogPage() {
  const { t } = useLocale();
  const { branches } = useBranch();
  const [page, setPage] = useState<AuditLogPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fModel, setFModel] = useState("");
  const [fAction, setFAction] = useState("");
  const [fActor, setFActor] = useState("");
  const [fBranch, setFBranch] = useState("");

  function load(url?: string) {
    const params = new URLSearchParams();
    if (fModel) params.set("model", fModel);
    if (fAction) params.set("action", fAction);
    if (fActor) params.set("actor", fActor);
    if (fBranch) params.set("branch", fBranch);
    const target = url || `${API_URL}/api/audit-log/?${params.toString()}`;
    apiFetch(target)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      })
      .then((json) => setPage(json))
      .catch((err) => setError(err instanceof Error ? err.message : t("auditLog.loadError")));
  }

  useEffect(load, [fModel, fAction, fActor, fBranch]);

  const hasFilters = Boolean(fModel || fAction || fActor || fBranch);
  function clearFilters() { setFModel(""); setFAction(""); setFActor(""); setFBranch(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!page) return <div className="dstate">{t("auditLog.loading")}</div>;

  return (
    <div className="dgrid">
      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("auditLog.title")}</h3><p>{t("auditLog.subtitle")}</p></div>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="al-model">{t("auditLog.filter.feature")}</label>
            <select id="al-model" value={fModel} onChange={(e) => setFModel(e.target.value)}>
              <option value="">{t("auditLog.filter.allFeatures")}</option>
              {MODEL_NAMES.map((m) => (
                <option key={m} value={m}>{t(`auditLog.model.${m}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="al-action">{t("auditLog.filter.action")}</label>
            <select id="al-action" value={fAction} onChange={(e) => setFAction(e.target.value)}>
              <option value="">{t("common.allStatuses")}</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{t(`auditLog.action.${a}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="al-branch">{t("nav.branch")}</label>
            <select id="al-branch" value={fBranch} onChange={(e) => setFBranch(e.target.value)}>
              <option value="">{t("nav.allBranches")}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="al-actor">{t("auditLog.filter.actor")}</label>
            <input id="al-actor" type="search" placeholder={t("auditLog.filter.actorPlaceholder")} value={fActor} onChange={(e) => setFActor(e.target.value)} />
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("auditLog.totalCount", { count: page.count })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("auditLog.col.time")}</th>
                  <th>{t("auditLog.col.actor")}</th>
                  <th>{t("auditLog.col.action")}</th>
                  <th>{t("auditLog.col.feature")}</th>
                  <th>{t("auditLog.col.record")}</th>
                  <th>{t("auditLog.col.branch")}</th>
                </tr>
              </thead>
              <tbody>
                {page.results.map((row) => (
                  <tr key={row.id}>
                    <td className="tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDateTime(row.created_at)}</td>
                    <td style={{ fontWeight: 500 }}>{row.actor_username || t("auditLog.systemActor")}</td>
                    <td className="nw"><span className={`dbadge ${ACTION_BADGE[row.action] || "neutral"}`}><i />{t(`auditLog.action.${row.action}`)}</span></td>
                    <td className="nw"><span className="dtag">{t(`auditLog.model.${row.model_name}`) || row.model_name}</span></td>
                    <td style={{ color: "var(--muted-foreground)" }}>{row.object_repr || `#${row.object_id}`}</td>
                    <td className="nw" style={{ color: "var(--muted-foreground)" }}>{row.branch_name || "—"}</td>
                  </tr>
                ))}
                {page.results.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--muted-foreground)", padding: 30 }}>{t("auditLog.empty")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px var(--card-pad)", borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--muted-foreground)" }}>
          <span>{t("common.showingOf", { shown: page.results.length, total: page.count })}</span>
          <span style={{ display: "flex", gap: 6 }}>
            <button className="dbtn" style={{ height: 26, padding: "0 10px" }} disabled={!page.previous} onClick={() => page.previous && load(page.previous)}>
              <Icon name="chevron-r" size={12} strokeWidth={2.5} className="rot-180" />
            </button>
            <button className="dbtn" style={{ height: 26, padding: "0 10px" }} disabled={!page.next} onClick={() => page.next && load(page.next)}>
              <Icon name="chevron-r" size={12} strokeWidth={2.5} />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
