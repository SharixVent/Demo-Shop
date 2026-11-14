// src/components/EditItem/ItemList.tsx
import React, { useEffect, useState } from "react";
import { pb } from "../../pocketbaseClient";
import type { Item } from "../../types/item";

const ItemList: React.FC<{
  onEdit: (item: Item) => void;
  refreshKey: number;
  searchTerm: string;
  onRefresh?: () => void;
}> = ({ onEdit, refreshKey, searchTerm, onRefresh }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [quickPriceId, setQuickPriceId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>("");

  const fetchItems = async () => {
  try {
    const records = await pb.collection("items").getFullList<Item>({
      requestKey: null,
    });
    setItems(records);
  } catch (error: any) {
    if (!error.isAbort) {
      console.error("Fetch items error:", error?.message || error);
    }
  }
};

  useEffect(() => {
    fetchItems();
  }, [refreshKey]);

  const handleDelete = async (item: Item) => {
    if (!confirm(`Are you sure you want to permanently delete "${item.name}"?`)) return;
    try {
      await pb.collection("items").delete(item.id as any);
      fetchItems();
      onRefresh?.();
    } catch (error: any) {
      alert("Error deleting product: " + (error?.message || "Unknown error"));
    }
  };

  // WordPress / WooCommerce 1-Click Duplicate Product
  const handleDuplicate = async (item: Item) => {
    try {
      await pb.collection("items").create({
        name: `${item.name} (Copy)`,
        category: item.category,
        subcategory: item.subcategory,
        sizes: item.sizes,
        price: item.price,
        description: item.description || "",
        material: item.material || "",
      });
      fetchItems();
      onRefresh?.();
    } catch (err: any) {
      alert("Duplicate failed: " + err.message);
    }
  };

  const handleQuickPriceSave = async (id: string) => {
    const parsed = parseFloat(quickPriceVal);
    if (isNaN(parsed) || parsed < 0) return;
    try {
      await pb.collection("items").update(id, { price: parsed });
      setQuickPriceId(null);
      fetchItems();
      onRefresh?.();
    } catch (err: any) {
      alert("Failed to update price: " + err.message);
    }
  };

  const getThumbUrl = (item: any) => {
    const imgs = item.images;
    const first = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : typeof imgs === "string" ? imgs : "";
    if (!first) return "";
    if (first.startsWith("http")) return first;
    return pb.files.getURL(item, first, { thumb: "100x100" });
  };

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  const term = searchTerm.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchCat = filterCat === "all" || item.category === filterCat;
    const matchTerm =
      !term ||
      (item.name?.toLowerCase() || "").includes(term) ||
      (item.category?.toLowerCase() || "").includes(term) ||
      (item.subcategory?.toLowerCase() || "").includes(term);
    return matchCat && matchTerm;
  });

  return (
    <div>
      {/* Category Filter Pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
        <button
          type="button"
          onClick={() => setFilterCat("all")}
          className={`admin-btn ${filterCat === "all" ? "admin-btn-primary" : "admin-btn-secondary"}`}
          style={{ padding: "6px 14px", fontSize: "0.82rem", borderRadius: "999px" }}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCat(cat)}
            className={`admin-btn ${filterCat === cat ? "admin-btn-primary" : "admin-btn-secondary"}`}
            style={{ padding: "6px 14px", fontSize: "0.82rem", borderRadius: "999px" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modern Card Grid replacing the old horizontal-scroll Table */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(275px, 1fr))",
          gap: "16px",
        }}
      >
        {filteredItems.map((item) => {
          const thumb = getThumbUrl(item);
          const hasPromo = item.sale_price && item.sale_price > 0;
          const hasSeo = !!(item.description && item.description.length >= 80 && item.material);

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                background: "#ffffff",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
              }}
            >
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.name}
                    style={{
                      width: "68px",
                      height: "82px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "68px",
                      height: "82px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      color: "#94a3b8",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    No Photo
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "2px 7px",
                        borderRadius: "999px",
                      }}
                    >
                      {item.category} • {item.subcategory || "General"}
                    </span>
                    <span
                      title={hasSeo ? "SEO Optimized" : "Missing long description or material"}
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        background: hasSeo ? "#dcfce7" : "#fef3c7",
                        color: hasSeo ? "#15803d" : "#b45309",
                        padding: "2px 6px",
                        borderRadius: "999px",
                      }}
                    >
                      {hasSeo ? "SEO ✓" : "SEO !"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "1rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </div>

                  {/* Quick Inline Price Editor */}
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {quickPriceId === item.id ? (
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <input
                          type="number"
                          step="0.01"
                          value={quickPriceVal}
                          onChange={(e) => setQuickPriceVal(e.target.value)}
                          style={{ width: "75px", padding: "3px 6px", borderRadius: "6px", border: "1px solid #2563eb" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickPriceSave(item.id)}
                          style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: "5px", padding: "3px 8px", cursor: "pointer", fontSize: "11px" }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setQuickPriceId(item.id);
                          setQuickPriceVal(String(item.price));
                        }}
                        style={{ cursor: "pointer" }}
                        title="Click to quick-edit price"
                      >
                        {hasPromo ? (
                          <>
                            <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "0.8rem", marginRight: "6px" }}>
                              ${item.price.toFixed(2)}
                            </span>
                            <span style={{ fontWeight: 800, color: "#dc2626", fontSize: "1rem" }}>
                              ${item.sale_price?.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "1rem" }}>
                            ${item.price.toFixed(2)} ✎
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sizes */}
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {(Array.isArray(item.sizes) ? item.sizes : [item.sizes]).map((sz, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "2px 7px",
                      borderRadius: "5px",
                      color: "#475569",
                    }}
                  >
                    {sz}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  marginTop: "auto",
                  paddingTop: "10px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="admin-btn admin-btn-secondary"
                  style={{ flex: 1, padding: "7px 10px", fontSize: "0.82rem" }}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicate(item)}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                  title="Duplicate Product"
                >
                  📋 Clone
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="admin-btn admin-btn-danger"
                  style={{ padding: "7px 10px", fontSize: "0.82rem" }}
                  title="Delete Product"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
          No products match your search criteria.
        </div>
      )}
    </div>
  );
};

export default ItemList;