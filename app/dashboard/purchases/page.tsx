"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { useBranch } from "../branch/BranchContext";
import { apiFetch } from "../../lib/auth/apiFetch";
import { useAuth } from "../../lib/auth/AuthContext";
import type { Branch, Category, Product, Purchase, PurchasesSummary, Supplier } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

const STATUS_BADGE: Record<string, string> = { ordered: "info", received: "success", cancelled: "danger" };

function tzs(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `TZS ${Math.round(n).toLocaleString("en-US")}`;
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type PurchaseForm = {
  supplier_id: string;
  product_id: string;
  item_name: string;
  category_id: string;
  quantity: string;
  unit_cost: string;
  status: string;
  purchase_date: string;
  branch_id: string;
};

function blankForm(suppliers: Supplier[], categories: Category[], branches: Branch[], defaultBranchId: string): PurchaseForm {
  return {
    supplier_id: suppliers[0] ? String(suppliers[0].id) : "",
    product_id: "",
    item_name: "",
    category_id: categories[0] ? String(categories[0].id) : "",
    quantity: "1",
    unit_cost: "0",
    status: "ordered",
    purchase_date: new Date().toISOString().slice(0, 10),
    branch_id: defaultBranchId || (branches[0] ? String(branches[0].id) : ""),
  };
}

export default function PurchasesPage() {
  const { t } = useLocale();
  const { branches, branchId } = useBranch();
  const [data, setData] = useState<PurchasesSummary | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fCategory, setFCategory] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSupplier, setFSupplier] = useState("");

  const branchIdRef = useRef(branchId);
  useEffect(() => {
    branchIdRef.current = branchId;
  }, [branchId]);

  function load() {
    const requestBranch = branchId;
    Promise.all([
      apiFetch(`${API_URL}/api/purchases/summary/?branch=${branchId}`).then((r) => {
        if (!r.ok) throw new Error(`API responded ${r.status}`);
        return r.json();
      }),
      apiFetch(`${API_URL}/api/suppliers/`).then((r) => r.json()),
      apiFetch(`${API_URL}/api/products/?branch=${branchId}`).then((r) => r.json()),
      apiFetch(`${API_URL}/api/categories/`).then((r) => r.json()),
    ])
      .then(([summary, supRes, prodRes, catRes]) => {
        if (requestBranch !== branchIdRef.current) return;
        setData(summary);
        setSuppliers(supRes.results || supRes);
        setProducts(prodRes.results || prodRes);
        setCategories(catRes.results || catRes);
      })
      .catch((err) => {
        if (requestBranch !== branchIdRef.current) return;
        setError(err instanceof Error ? err.message : t("purchases.loadError"));
      });
  }

  useEffect(load, [branchId]);

  async function handleDelete(p: Purchase) {
    if (!window.confirm(t("purchases.confirmDelete", { po: p.po_number }))) return;
    await apiFetch(`${API_URL}/api/purchases/${p.id}/`, { method: "DELETE" });
    load();
  }

  const allPurchases = useMemo(() => data?.purchases ?? [], [data]);
  const filtered = useMemo(() => {
    return allPurchases.filter((p) => {
      if (fCategory && String(p.category?.id ?? "") !== fCategory) return false;
      if (fStatus && p.status !== fStatus) return false;
      if (fSupplier && String(p.supplier?.id ?? "") !== fSupplier) return false;
      return true;
    });
  }, [allPurchases, fCategory, fStatus, fSupplier]);
  const hasFilters = Boolean(fCategory || fStatus || fSupplier);
  function clearFilters() { setFCategory(""); setFStatus(""); setFSupplier(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("purchases.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("purchases.kpi.spendThisMonth"), v: tzs(data.kpis.total_spend_this_month), icon: "cart", color: "var(--chart-2)" },
    { l: t("purchases.kpi.pendingOrders"), v: String(data.kpis.pending_orders), icon: "clock", color: "var(--warning-foreground)" },
    { l: t("purchases.kpi.receivedThisMonth"), v: String(data.kpis.received_this_month), icon: "check-square", color: "var(--success)" },
    { l: t("purchases.kpi.totalPurchases"), v: String(data.kpis.total_purchases), icon: "folder", color: "var(--chart-5)" },
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
            <p className="v tnum" style={{ color: k.color, fontSize: 22 }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="dcard dc12">
        <div className="dcard-hd">
          <div><h3>{t("purchases.title")}</h3><p>{t("purchases.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("purchases.addPurchase")}
          </button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="pf-category">{t("purchases.field.category")}</label>
            <select id="pf-category" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
              <option value="">{t("common.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="pf-status">{t("purchases.field.status")}</label>
            <select id="pf-status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">{t("common.allStatuses")}</option>
              <option value="ordered">{t("enums.purchaseStatus.ordered")}</option>
              <option value="received">{t("enums.purchaseStatus.received")}</option>
              <option value="cancelled">{t("enums.purchaseStatus.cancelled")}</option>
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="pf-supplier">{t("purchases.field.supplier")}</label>
            <select id="pf-supplier" value={fSupplier} onChange={(e) => setFSupplier(e.target.value)}>
              <option value="">{t("purchases.field.allSuppliers")}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allPurchases.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("purchases.col.po")}</th>
                  <th>{t("purchases.col.item")}</th>
                  <th>{t("inventory.col.stockItem")}</th>
                  <th>{t("purchases.col.supplier")}</th>
                  <th>{t("purchases.col.category")}</th>
                  {branchId === "all" && <th>{t("nav.branch")}</th>}
                  <th className="num">{t("purchases.col.qty")}</th>
                  <th className="num">{t("purchases.col.unitCost")}</th>
                  <th className="num">{t("purchases.col.total")}</th>
                  <th>{t("purchases.col.status")}</th>
                  <th className="num">{t("purchases.col.date")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="tnum nw" style={{ color: "var(--muted-foreground)" }}>{p.po_number}</td>
                    <td style={{ fontWeight: 500 }}>{p.item_name}</td>
                    <td className="nw">{p.product ? <span className="dtag">{p.product.name}</span> : <span style={{ color: "var(--muted-foreground)" }}>—</span>}</td>
                    <td style={{ color: "var(--muted-foreground)" }}>{p.supplier?.name || "—"}</td>
                    <td className="nw">{p.category ? <span className="dtag">{p.category.name}</span> : <span style={{ color: "var(--muted-foreground)" }}>—</span>}</td>
                    {branchId === "all" && <td style={{ color: "var(--muted-foreground)" }}>{p.branch?.name || "—"}</td>}
                    <td className="num tnum nw">{p.quantity}</td>
                    <td className="num tnum nw">{tzs(p.unit_cost)}</td>
                    <td className="num tnum nw" style={{ fontWeight: 600 }}>{tzs(p.total_cost)}</td>
                    <td className="nw"><span className={`dbadge ${STATUS_BADGE[p.status] || "neutral"}`}><i />{t(`enums.purchaseStatus.${p.status}`)}</span></td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{formatDate(p.purchase_date)}</td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("purchases.aria.edit")} onClick={() => { setEditing(p); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("purchases.aria.delete")} onClick={() => handleDelete(p)}>
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
        <PurchaseFormModal
          purchase={editing}
          suppliers={suppliers}
          products={products}
          categories={categories}
          branches={branches}
          defaultBranchId={branchId !== "all" ? branchId : ""}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function PurchaseFormModal({
  purchase,
  suppliers,
  products,
  categories,
  branches,
  defaultBranchId,
  onClose,
  onSaved,
}: {
  purchase: Purchase | null;
  suppliers: Supplier[];
  products: Product[];
  categories: Category[];
  branches: Branch[];
  defaultBranchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const { hasRole } = useAuth();
  const canPickBranch = hasRole("superadmin", "admin");
  const [form, setForm] = useState<PurchaseForm>(
    purchase
      ? {
          supplier_id: purchase.supplier ? String(purchase.supplier.id) : "",
          product_id: purchase.product ? String(purchase.product.id) : "",
          item_name: purchase.item_name,
          category_id: purchase.category ? String(purchase.category.id) : "",
          quantity: String(purchase.quantity),
          unit_cost: purchase.unit_cost,
          status: purchase.status,
          purchase_date: purchase.purchase_date,
          branch_id: purchase.branch ? String(purchase.branch.id) : defaultBranchId || (branches[0] ? String(branches[0].id) : ""),
        }
      : blankForm(suppliers, categories, branches, defaultBranchId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchProducts = useMemo(
    () => products.filter((p) => String(p.branch?.id ?? "") === form.branch_id),
    [products, form.branch_id]
  );

  function update<K extends keyof PurchaseForm>(key: K, value: PurchaseForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = purchase ? `${API_URL}/api/purchases/${purchase.id}/` : `${API_URL}/api/purchases/`;
      const payload = {
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        product_id: form.product_id ? Number(form.product_id) : null,
        item_name: form.item_name,
        category_id: form.category_id ? Number(form.category_id) : null,
        quantity: Number(form.quantity),
        unit_cost: form.unit_cost,
        status: form.status,
        purchase_date: form.purchase_date,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
      };
      const res = await apiFetch(url, {
        method: purchase ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("purchases.form.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={purchase ? t("purchases.form.editTitle", { po: purchase.po_number }) : t("purchases.addPurchase")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="p-item">{t("purchases.field.itemName")}</label>
          <input id="p-item" required value={form.item_name} onChange={(e) => update("item_name", e.target.value)} />
        </div>
        <div className="dfield">
          <label htmlFor="p-branch">{t("nav.branch")}</label>
          {canPickBranch ? (
            <select id="p-branch" required value={form.branch_id} onChange={(e) => update("branch_id", e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          ) : (
            <input id="p-branch" value={branches.find((b) => String(b.id) === form.branch_id)?.name ?? ""} disabled readOnly />
          )}
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="p-supplier">{t("purchases.field.supplier")}</label>
            <select id="p-supplier" value={form.supplier_id} onChange={(e) => update("supplier_id", e.target.value)}>
              <option value="">{t("common.none")}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="p-category">{t("purchases.field.category")}</label>
            <select id="p-category" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
              <option value="">{t("common.none")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="p-product">{t("inventory.field.linkToProduct")}</label>
          <select id="p-product" value={form.product_id} onChange={(e) => update("product_id", e.target.value)}>
            <option value="">{t("inventory.field.notTracked")}</option>
            {branchProducts.map((prod) => (
              <option key={prod.id} value={prod.id}>{prod.name}</option>
            ))}
          </select>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="p-qty">{t("purchases.field.quantity")}</label>
            <input id="p-qty" type="number" min="1" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="p-cost">{t("purchases.field.unitCost")}</label>
            <input id="p-cost" type="number" min="0" step="1000" value={form.unit_cost} onChange={(e) => update("unit_cost", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="p-status">{t("purchases.field.status")}</label>
            <select id="p-status" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="ordered">{t("enums.purchaseStatus.ordered")}</option>
              <option value="received">{t("enums.purchaseStatus.received")}</option>
              <option value="cancelled">{t("enums.purchaseStatus.cancelled")}</option>
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="p-date">{t("purchases.field.purchaseDate")}</label>
            <input id="p-date" type="date" required value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} />
          </div>
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : purchase ? t("common.saveChanges") : t("purchases.addPurchase")}</button>
        </div>
      </form>
    </Modal>
  );
}
