"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import Modal from "../Modal";
import { useLocale } from "../i18n/LocaleContext";
import { useBranch } from "../branch/BranchContext";
import type { Branch, Category, InventorySummary, Product, StockMovement } from "../types";
import { apiFetch } from "../../lib/auth/apiFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

type ProductForm = {
  name: string;
  category_id: string;
  branch_id: string;
  unit: string;
  reorder_level: string;
  quantity_on_hand: string;
  notes: string;
};

function blankForm(categories: Category[], branchId: string): ProductForm {
  return {
    name: "",
    category_id: categories[0] ? String(categories[0].id) : "",
    branch_id: branchId,
    unit: "pcs",
    reorder_level: "0",
    quantity_on_hand: "0",
    notes: "",
  };
}

export default function InventoryPage() {
  const { t } = useLocale();
  const { branches, branchId } = useBranch();
  const [data, setData] = useState<InventorySummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [fCategory, setFCategory] = useState("");
  const [fStock, setFStock] = useState("");

  const branchIdRef = useRef(branchId);
  useEffect(() => {
    branchIdRef.current = branchId;
  }, [branchId]);

  function load() {
    const requestBranch = branchId;
    Promise.all([
      apiFetch(`${API_URL}/api/inventory/summary/?branch=${branchId}`).then((r) => {
        if (!r.ok) throw new Error(`API responded ${r.status}`);
        return r.json();
      }),
      apiFetch(`${API_URL}/api/categories/`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([summary, catRes]) => {
        if (requestBranch !== branchIdRef.current) return; // a newer branch selection superseded this request
        setData(summary);
        setCategories(Array.isArray(catRes) ? catRes : catRes.results || []);
      })
      .catch((err) => {
        if (requestBranch !== branchIdRef.current) return;
        setError(err instanceof Error ? err.message : t("inventory.loadError"));
      });
  }

  useEffect(load, [branchId]);

  async function handleDelete(p: Product) {
    if (!window.confirm(t("inventory.confirmDelete", { name: p.name }))) return;
    await apiFetch(`${API_URL}/api/products/${p.id}/`, { method: "DELETE" });
    load();
  }

  const allProducts = useMemo(() => data?.products ?? [], [data]);
  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      if (fCategory && String(p.category?.id ?? "") !== fCategory) return false;
      if (fStock === "low" && !p.is_low_stock) return false;
      if (fStock === "out" && !p.is_out_of_stock) return false;
      return true;
    });
  }, [allProducts, fCategory, fStock]);
  const hasFilters = Boolean(fCategory || fStock);
  function clearFilters() { setFCategory(""); setFStock(""); }

  if (error) {
    return (
      <div className="dstate">
        {t("common.apiError")} {API_URL}.<br />
        ({error}) — {t("common.apiErrorHint")}
      </div>
    );
  }
  if (!data) return <div className="dstate">{t("inventory.loading")}</div>;

  const kpis: { l: string; v: string; icon: Parameters<typeof Icon>[0]["name"]; color: string }[] = [
    { l: t("inventory.kpi.totalProducts"), v: String(data.kpis.total_products), icon: "box", color: "var(--chart-1)" },
    { l: t("inventory.kpi.lowStock"), v: String(data.kpis.low_stock_count), icon: "flag", color: "var(--warning-foreground)" },
    { l: t("inventory.kpi.outOfStock"), v: String(data.kpis.out_of_stock_count), icon: "x", color: "var(--destructive)" },
    { l: t("inventory.kpi.totalUnits"), v: String(data.kpis.total_units_on_hand), icon: "check-square", color: "var(--success)" },
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

      <div className="dcard dc8" style={{ marginBottom: "var(--card-gap)" }}>
        <div className="dcard-hd">
          <div><h3>{t("inventory.products.title")}</h3><p>{t("inventory.products.subtitle")}</p></div>
          <button className="dbtn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Icon name="plus" />{t("inventory.addProduct")}
          </button>
        </div>
        <div className="dfilterbar">
          <div className="fgroup">
            <label htmlFor="if-category">{t("inventory.filter.category")}</label>
            <select id="if-category" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
              <option value="">{t("common.allCategories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="fgroup">
            <label htmlFor="if-stock">{t("inventory.filter.stockStatus")}</label>
            <select id="if-stock" value={fStock} onChange={(e) => setFStock(e.target.value)}>
              <option value="">{t("inventory.filter.allStock")}</option>
              <option value="low">{t("inventory.filter.lowStock")}</option>
              <option value="out">{t("inventory.filter.outOfStock")}</option>
            </select>
          </div>
          {hasFilters && (
            <button type="button" className="dfilter-clear" onClick={clearFilters}>{t("common.clearFilters")}</button>
          )}
          <span className="dfilter-count">{t("common.showingOf", { shown: filtered.length, total: allProducts.length })}</span>
        </div>
        <div className="dcard-bd flush" style={{ paddingTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{t("inventory.col.name")}</th>
                  <th>{t("inventory.col.category")}</th>
                  {branchId === "all" && <th>{t("nav.branch")}</th>}
                  <th className="num">{t("inventory.col.onHand")}</th>
                  <th className="num">{t("inventory.col.reorderLevel")}</th>
                  <th>{t("inventory.col.status")}</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td className="nw">{p.category ? <span className="dtag">{p.category.name}</span> : <span style={{ color: "var(--muted-foreground)" }}>—</span>}</td>
                    {branchId === "all" && <td className="nw">{p.branch?.name || "—"}</td>}
                    <td className="num tnum nw" style={{ fontWeight: 600, color: p.quantity_on_hand < 0 ? "var(--destructive)" : "var(--foreground)" }}>
                      {p.quantity_on_hand} {p.unit}
                    </td>
                    <td className="num tnum nw" style={{ color: "var(--muted-foreground)" }}>{p.reorder_level}</td>
                    <td className="nw">
                      {p.is_out_of_stock ? (
                        <span className="dbadge danger"><i />{t("inventory.status.outOfStock")}</span>
                      ) : p.is_low_stock ? (
                        <span className="dbadge warning"><i />{t("inventory.status.lowStock")}</span>
                      ) : (
                        <span className="dbadge success"><i />{t("inventory.status.inStock")}</span>
                      )}
                    </td>
                    <td className="num nw">
                      <div className="dactions">
                        <button className="dash-icon-btn" aria-label={t("inventory.aria.adjust")} onClick={() => setAdjusting(p)}>
                          <Icon name="trending-up" size={15} />
                        </button>
                        <button className="dash-icon-btn" aria-label={t("common.edit")} onClick={() => { setEditing(p); setShowForm(true); }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button className="dash-icon-btn danger" aria-label={t("common.delete")} onClick={() => handleDelete(p)}>
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

      <div className="dcard dc4" style={{ marginBottom: "var(--card-gap)" }}>
        <CategoriesCard categories={categories} onChanged={load} />
      </div>

      <div className="dcard dc12" style={{ marginBottom: "var(--card-gap)" }}>
        <div className="dcard-hd"><div><h3>{t("inventory.movements.title")}</h3><p>{t("inventory.movements.subtitle")}</p></div></div>
        <div className="dcard-bd" style={{ paddingTop: 4, gap: 10, maxHeight: 420, overflowY: "auto" }}>
          {data.recent_movements.length === 0 && (
            <p style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>{t("inventory.movements.empty")}</p>
          )}
          {data.recent_movements.map((m) => (
            <MovementRow key={m.id} movement={m} />
          ))}
        </div>
      </div>

      {showForm && (
        <ProductFormModal
          product={editing}
          categories={categories}
          branches={branches}
          activeBranchId={branchId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {adjusting && (
        <AdjustStockModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => { setAdjusting(null); load(); }}
        />
      )}
    </div>
  );
}

function CategoriesCard({ categories, onChanged }: { categories: Category[]; onChanged: () => void }) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_URL}/api/categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.name?.[0] || t("inventory.categories.saveError"));
      }
      setName("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inventory.categories.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Category) {
    const usage = c.products_count + c.purchases_count;
    const message = usage > 0
      ? t("inventory.categories.confirmDeleteInUse", { name: c.name, count: usage })
      : t("inventory.categories.confirmDelete", { name: c.name });
    if (!window.confirm(message)) return;
    await apiFetch(`${API_URL}/api/categories/${c.id}/`, { method: "DELETE" });
    onChanged();
  }

  return (
    <>
      <div className="dcard-hd"><div><h3>{t("inventory.categories.title")}</h3><p>{t("inventory.categories.subtitle")}</p></div></div>
      <div className="dcard-bd" style={{ paddingTop: 6, gap: 12 }}>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
          <input
            aria-label={t("inventory.categories.namePlaceholder")}
            placeholder={t("inventory.categories.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1, height: 32, padding: "0 10px", border: "1px solid var(--input)", borderRadius: "var(--radius-sm)", fontSize: 12.5, background: "var(--card)", color: "var(--foreground)" }}
          />
          <button type="submit" className="dbtn primary" disabled={saving || !name.trim()} style={{ height: 32, padding: "0 12px" }}>
            <Icon name="plus" size={14} />{t("inventory.categories.add")}
          </button>
        </form>
        {error && <div className="dform-error">{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
          {categories.length === 0 && (
            <p style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>{t("inventory.categories.empty")}</p>
          )}
          {categories.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{c.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
                  {t("inventory.categories.usage", { count: c.products_count + c.purchases_count })}
                </span>
                <button className="dash-icon-btn danger" aria-label={t("common.delete")} onClick={() => handleDelete(c)}>
                  <Icon name="trash" size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const { t } = useLocale();
  const positive = movement.change > 0;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, fontSize: 12.5, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500 }} className="trunc">{movement.product.name}</div>
        <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
          {t(`enums.stockReason.${movement.reason}`)}
          {movement.reference ? ` · ${movement.reference}` : ""}
        </div>
        {movement.note && <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{movement.note}</div>}
        <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{formatDateTime(movement.created_at)}</div>
      </div>
      <b className="tnum" style={{ color: positive ? "var(--success)" : "var(--destructive)", whiteSpace: "nowrap" }}>
        {positive ? "+" : ""}{movement.change}
      </b>
    </div>
  );
}

function ProductFormModal({
  product,
  categories,
  branches,
  activeBranchId,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  branches: Branch[];
  activeBranchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const defaultBranchId =
    activeBranchId !== "all" ? activeBranchId : branches[0] ? String(branches[0].id) : "";
  const [form, setForm] = useState<ProductForm>(
    product
      ? {
          name: product.name,
          category_id: product.category ? String(product.category.id) : "",
          branch_id: product.branch ? String(product.branch.id) : "",
          unit: product.unit,
          reorder_level: String(product.reorder_level),
          quantity_on_hand: String(product.quantity_on_hand),
          notes: product.notes,
        }
      : blankForm(categories, defaultBranchId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = product ? `${API_URL}/api/products/${product.id}/` : `${API_URL}/api/products/`;
      const payload: Record<string, unknown> = {
        name: form.name,
        category_id: form.category_id ? Number(form.category_id) : null,
        unit: form.unit,
        reorder_level: Number(form.reorder_level),
        notes: form.notes,
      };
      if (!product) {
        payload.quantity_on_hand = Number(form.quantity_on_hand);
        payload.branch_id = Number(form.branch_id);
      }
      const res = await apiFetch(url, {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body) : `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inventory.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={product ? t("inventory.form.editTitle", { name: product.name }) : t("inventory.addProduct")} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <div className="dfield">
          <label htmlFor="p-name">{t("inventory.field.name")}</label>
          <input id="p-name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="p-category">{t("inventory.field.category")}</label>
            <select id="p-category" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
              <option value="">{t("common.none")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="dfield">
            <label htmlFor="p-unit">{t("inventory.field.unit")}</label>
            <input id="p-unit" value={form.unit} onChange={(e) => update("unit", e.target.value)} />
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="p-branch">{t("nav.branch")}</label>
            <select
              id="p-branch"
              required
              disabled={Boolean(product)}
              value={form.branch_id}
              onChange={(e) => update("branch_id", e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="dfield-row">
          <div className="dfield">
            <label htmlFor="p-reorder">{t("inventory.field.reorderLevel")}</label>
            <input id="p-reorder" type="number" min="0" value={form.reorder_level} onChange={(e) => update("reorder_level", e.target.value)} />
          </div>
          <div className="dfield">
            <label htmlFor="p-qty">{t("inventory.field.startingStock")}</label>
            <input
              id="p-qty"
              type="number"
              disabled={Boolean(product)}
              value={form.quantity_on_hand}
              onChange={(e) => update("quantity_on_hand", e.target.value)}
            />
            {product && <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{t("inventory.field.stockHint")}</span>}
          </div>
        </div>
        <div className="dfield">
          <label htmlFor="p-notes">{t("inventory.field.notes")}</label>
          <input id="p-notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : product ? t("common.saveChanges") : t("inventory.addProduct")}</button>
        </div>
      </form>
    </Modal>
  );
}

function AdjustStockModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const [delta, setDelta] = useState("0");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(delta);
    if (!parsed) {
      setError(t("inventory.adjust.needsNonZero"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_URL}/api/products/${product.id}/adjust/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: parsed, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Request failed (${res.status})`);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inventory.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t("inventory.adjust.title", { name: product.name })} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="dform-error">{error}</div>}
        <p style={{ fontSize: 12.5, color: "var(--muted-foreground)", marginTop: -4, marginBottom: 12 }}>
          {t("inventory.adjust.currentStock", { qty: product.quantity_on_hand, unit: product.unit })}
        </p>
        <div className="dfield">
          <label htmlFor="adj-delta">{t("inventory.adjust.deltaLabel")}</label>
          <input id="adj-delta" type="number" required value={delta} onChange={(e) => setDelta(e.target.value)} />
        </div>
        <div className="dfield">
          <label htmlFor="adj-note">{t("inventory.adjust.noteLabel")}</label>
          <input id="adj-note" placeholder={t("inventory.adjust.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="dform-actions">
          <button type="button" className="dbtn" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="dbtn primary" disabled={saving}>{saving ? t("common.saving") : t("inventory.adjust.submit")}</button>
        </div>
      </form>
    </Modal>
  );
}
