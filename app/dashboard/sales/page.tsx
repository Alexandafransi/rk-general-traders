"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { useBranch } from "../branch/BranchContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";
import type { Product, Sale, SalesSummary } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const CATEGORIES = [
  { value: "fiber_installation", label: "Fiber Installation" },
  { value: "router_setup", label: "Router Setup" },
  { value: "wifi_extender", label: "Wi-Fi Extender" },
  { value: "mikrotik_voucher", label: "Mikrotik Voucher" },
  { value: "access_point", label: "Access Point" },
  { value: "fiber_onu_ont", label: "Fiber ONU/ONT" },
  { value: "power_backup", label: "Power Backup (UPS)" },
  { value: "support", label: "Support" },
  { value: "product_sale", label: "Product Sale" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
];

const STATUS_BADGE: Record<string, string> = { unpaid: "danger", partial: "warning", paid: "success" };

function tzs(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `TZS ${Math.round(n).toLocaleString("en-US")}`;
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type SaleForm = {
  customer_name: string;
  branch_id: string;
  product_id: string;
  category: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount_paid: string;
  payment_status: string;
  payment_method: string;
  sale_date: string;
};

const BLANK_FORM: SaleForm = {
  customer_name: "",
  branch_id: "",
  product_id: "",
  category: "product_sale",
  description: "",
  quantity: "1",
  unit_price: "0",
  amount_paid: "0",
  payment_status: "unpaid",
  payment_method: "cash",
  sale_date: new Date().toISOString().slice(0, 10),
};

export default function SalesPage() {
  const { t } = useLocale();
  const { branchId } = useBranch();
  const [data, setData] = useState<SalesSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fCategory, setFCategory] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  const branchIdRef = useRef(branchId);
  useEffect(() => {
    branchIdRef.current = branchId;
  }, [branchId]);

  function load() {
    const requestBranch = branchId;
    Promise.all([
      apiFetch(`${API_URL}/api/sales/summary/?branch=${branchId}`).then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json();
      }),
      apiFetch(`${API_URL}/api/products/?branch=${branchId}`).then((r) => r.json()),
    ])
      .then(([json, prodRes]) => {
        if (requestBranch !== branchIdRef.current) return;
        setData(json);
        setProducts(prodRes.results || prodRes);
      })
      .catch((err) => {
        if (requestBranch !== branchIdRef.current) return;
        setError(err instanceof Error ? err.message : t("sales.loadError"));
      });
  }

  useEffect(load, [branchId]);

  async function handleDelete(s: Sale) {
    if (!window.confirm(t("sales.deleteConfirm", { invoice: s.invoice_number }))) return;
    await apiFetch(`${API_URL}/api/sales/${s.id}/`, { method: "DELETE" });
    load();
  }

  const allSales = useMemo(() => data?.sales ?? [], [data]);
  const filtered = useMemo(() => {
    return allSales.filter((s) => {
      if (fCategory && s.category !== fCategory) return false;
      if (fStatus && s.payment_status !== fStatus) return false;
      if (fFrom && s.sale_date < fFrom) return false;
      if (fTo && s.sale_date > fTo) return false;
      return true;
    });
  }, [allSales, fCategory, fStatus, fFrom, fTo]);
  const hasFilters = Boolean(fCategory || fStatus || fFrom || fTo);
  function clearFilters() {
    setFCategory("");
    setFStatus("");
    setFFrom("");
    setFTo("");
  }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("sales.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("sales.kpi.revenueThisMonth"), v: tzs(data.kpis.revenue_this_month), icon: "trending-up", color: "var(--success)" },
    { l: t("sales.kpi.collected"), v: tzs(data.kpis.collected_this_month), icon: "wallet", color: "var(--chart-5)" },
    { l: t("sales.kpi.outstandingBalance"), v: tzs(data.kpis.outstanding_balance), icon: "clock", color: "var(--destructive)" },
    { l: t("sales.kpi.salesThisMonth"), v: String(data.kpis.count_this_month), icon: "cart", color: "var(--chart-1)" },
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
          <div><h3>{t("sales.title")}</h3><p>{t("sales.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("sales.addSale")}
          </button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="f-category">{t("sales.category")}</label>
            <select id="f-category" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
              <option value="">{t("common.allCategories")}</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{t(`enums.serviceCategory.${c.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="f-status">{t("sales.status")}</label>
            <select id="f-status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">{t("common.allStatuses")}</option>
              <option value="unpaid">{t("enums.paymentStatus.unpaid")}</option>
              <option value="partial">{t("enums.paymentStatus.partial")}</option>
              <option value="paid">{t("enums.paymentStatus.paid")}</option>
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="f-from">{t("sales.filter.from")}</label>
            <input id="f-from" type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} />
          </div>
          <div className="fgroup">
            <label htmlFor="f-to">{t("sales.filter.to")}</label>
            <input id="f-to" type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} />
          </div>
          {hasFilters && <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allSales.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("sales.col.invoiceNumber")}</th>
                  <th>{t("sales.col.customer")}</th>
                  <th>{t("sales.description")}</th>
                  <th>{t("inventory.col.stockItem")}</th>
                  <th>{t("sales.category")}</th>
                  {branchId === "all" && <th>{t("nav.branch")}</th>}
                  <th className="num">{t("sales.col.amount")}</th>
                  <th className="num">{t("sales.col.paid")}</th>
                  <th className="num">{t("sales.col.balance")}</th>
                  <th>{t("sales.status")}</th>
                  <th className="num">{t("sales.col.date")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="tnum nw" style={{ color: "var(--muted-foreground)" }}>{s.invoice_number}</td>
                    <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                    <td style={{ color: "var(--muted-foreground)" }}>{s.description}{s.quantity > 1 ? ` ×${s.quantity}` : ""}</td>
                    <td className="nw">{s.product ? <span className="dtag">{s.product.name}</span> : <span style={{ color: "var(--muted-foreground)" }}>—</span>}</td>
                    <td className="nw"><span className="dtag">{t(`enums.serviceCategory.${s.category}`)}</span></td>
                    {branchId === "all" && <td className="nw">{s.branch?.name || "—"}</td>}
                    <td className="num tnum nw" style={{ fontWeight: 600 }}>{tzs(s.amount)}</td>
                    <td className="num tnum nw" style={{ color: "var(--success)" }}>{tzs(s.amount_paid)}</td>
                    <td className="num tnum nw" style={{ color: s.balance_due > 0 ? "var(--destructive)" : "var(--muted-foreground)" }}>{tzs(s.balance_due)}</td>
                    <td className="nw"><span className={`dbadge ${STATUS_BADGE[s.payment_status] || "neutral"}`}><i />{t(`enums.paymentStatus.${s.payment_status}`)}</span></td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(s.sale_date)}</td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("sales.editSale")} onClick={() => { setEditing(s); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("sales.deleteSale")} onClick={() => handleDelete(s)}>
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
        <SaleFormModal
          sale={editing}
          products={products}
          activeBranchId={branchId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function SaleFormModal({
  sale,
  products,
  activeBranchId,
  onClose,
  onSaved,
}: {
  sale: Sale | null;
  products: Product[];
  activeBranchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const { hasRole } = useAuth();
  const { branches } = useBranch();
  const canPickBranch = hasRole("superadmin", "admin");
  const defaultBranchId =
    activeBranchId !== "all" ? activeBranchId : branches.length > 0 ? String(branches[0].id) : "";
  const [form, setForm] = useState<SaleForm>(
    sale
      ? {
          customer_name: sale.customer_name,
          branch_id: sale.branch ? String(sale.branch.id) : defaultBranchId,
          product_id: sale.product ? String(sale.product.id) : "",
          category: sale.category,
          description: sale.description,
          quantity: String(sale.quantity),
          unit_price: sale.unit_price,
          amount_paid: sale.amount_paid,
          payment_status: sale.payment_status,
          payment_method: sale.payment_method,
          sale_date: sale.sale_date,
        }
      : { ...BLANK_FORM, branch_id: defaultBranchId }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const branchProducts = useMemo(
    () => products.filter((p) => String(p.branch?.id ?? "") === form.branch_id),
    [products, form.branch_id]
  );

  function update<K extends keyof SaleForm>(key: K, value: SaleForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = sale ? `${API_URL}/api/sales/${sale.id}/` : `${API_URL}/api/sales/`;
      const payload = {
        customer_name: form.customer_name,
        branch_id: Number(form.branch_id),
        product_id: form.product_id ? Number(form.product_id) : null,
        category: form.category,
        description: form.description,
        quantity: Number(form.quantity),
        unit_price: form.unit_price,
        amount_paid: form.amount_paid,
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        sale_date: form.sale_date,
      };
      const res = await apiFetch(url, {
        method: sale ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sales.form.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={sale ? t("sales.form.editTitle", { invoice: sale.invoice_number }) : t("sales.addSale")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="sl-customer">{t("sales.field.customerName")}</label>
            <input id="sl-customer" required value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="sl-category">{t("sales.category")}</label>
            <select id="sl-category" value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{t(`enums.serviceCategory.${c.value}`)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="sl-branch">{t("nav.branch")}</label>
            {canPickBranch ? (
              <select
                id="sl-branch"
                required
                value={form.branch_id}
                onChange={(e) => {
                  const branch_id = e.target.value;
                  setForm((f) => ({ ...f, branch_id, product_id: "" }));
                }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <input id="sl-branch" value={branches.find((b) => String(b.id) === form.branch_id)?.name ?? ""} disabled readOnly />
            )}
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="sl-desc">{t("sales.description")}</label>
          <input id="sl-desc" required value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="dfield">
          <label htmlFor="sl-product">{t("inventory.field.linkToProduct")}</label>
          <select id="sl-product" value={form.product_id} onChange={(e) => update("product_id", e.target.value)}>
            <option value="">{t("inventory.field.notTracked")}</option>
            {branchProducts.map((prod) => (
              <option key={prod.id} value={prod.id}>{prod.name}</option>
            ))}
          </select>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="sl-qty">{t("sales.field.quantity")}</label>
            <input id="sl-qty" type="number" min="1" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="sl-price">{t("sales.field.unitPrice")}</label>
            <input id="sl-price" type="number" min="0" step="1000" value={form.unit_price} onChange={(e) => update("unit_price", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="sl-paid">{t("sales.field.amountPaid")}</label>
            <input id="sl-paid" type="number" min="0" step="1000" value={form.amount_paid} onChange={(e) => update("amount_paid", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="sl-status">{t("sales.field.paymentStatus")}</label>
            <select id="sl-status" value={form.payment_status} onChange={(e) => update("payment_status", e.target.value)}>
              <option value="unpaid">{t("enums.paymentStatus.unpaid")}</option>
              <option value="partial">{t("enums.paymentStatus.partial")}</option>
              <option value="paid">{t("enums.paymentStatus.paid")}</option>
            </select>
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="sl-method">{t("sales.field.paymentMethod")}</label>
            <select id="sl-method" value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{t(`enums.paymentMethod.${m.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="sl-date">{t("sales.field.saleDate")}</label>
            <input id="sl-date" type="date" required value={form.sale_date} onChange={(e) => update("sale_date", e.target.value)} />
          </div>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : sale ? t("common.saveChanges") : t("sales.addSale")}</button>
        </div>
      </form>
    </Modal>
  );
}
