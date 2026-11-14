// src/components/EditPromotions/EditPromotions.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../../pocketbaseClient";
import type { Item } from "../../types/item";
import "../../AdminStyles.css";

const PromotionCard: React.FC<{ item: Item; onRefresh: () => void }> = ({ item, onRefresh }) => {
  const [salePrice, setSalePrice] = useState<number | "">(item.sale_price || "");
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [endDate, setEndDate] = useState<string>(
    item.sale_end_date ? item.sale_end_date.substring(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSalePrice(item.sale_price || "");
    setEndDate(item.sale_end_date ? item.sale_end_date.substring(0, 10) : "");
    if (item.sale_price && item.price > 0) {
      const diff = item.price - item.sale_price;
      setDiscountPercent(Math.round((diff / item.price) * 100));
    } else {
      setDiscountPercent("");
    }
  }, [item]);

  const handlePriceChange = (val: string) => {
    const newSalePrice = parseFloat(val);
    if (isNaN(newSalePrice)) {
      setSalePrice("");
      setDiscountPercent("");
      return;
    }
    setSalePrice(newSalePrice);
    if (item.price > 0 && newSalePrice < item.price) {
      setDiscountPercent(Math.round(((item.price - newSalePrice) / item.price) * 100));
    } else {
      setDiscountPercent("");
    }
  };

  const handlePercentChange = (perc: number) => {
    setDiscountPercent(perc);
    if (item.price > 0 && perc > 0 && perc < 100) {
      const newPrice = item.price - (item.price * perc) / 100;
      setSalePrice(parseFloat(newPrice.toFixed(2)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pb.collection("items").update(item.id as string, {
        sale_price: salePrice === "" ? null : salePrice,
        sale_end_date: endDate || "",
      });
      onRefresh();
    } catch (err: any) {
      alert("Error saving promotion: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await pb.collection("items").update(item.id as string, {
        sale_price: null,
        sale_end_date: "",
      });
      setSalePrice("");
      setDiscountPercent("");
      setEndDate("");
      onRefresh();
    } catch (err: any) {
      alert("Error clearing promotion: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isActive = !!(item.sale_price && item.sale_price > 0);

  return (
    <div
      className="admin-card"
      style={{
        margin: 0,
        border: isActive ? "2px solid #dc2626" : "1px solid #e2e8f0",
        background: isActive ? "#fffafa" : "#ffffff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
            {item.category} • {item.subcategory}
          </span>
          <h3 style={{ margin: "4px 0", fontSize: "1.05rem" }}>{item.name}</h3>
        </div>
        <span style={{ fontWeight: 800, color: "#64748b" }}>${item.price.toFixed(2)}</span>
      </div>

      {/* Quick Preset Discount Buttons */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {[10, 20, 30, 50].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePercentChange(p)}
            style={{
              flex: 1,
              padding: "5px",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "6px",
              border: "1px solid #fecaca",
              background: discountPercent === p ? "#dc2626" : "#fef2f2",
              color: discountPercent === p ? "#fff" : "#dc2626",
              cursor: "pointer",
            }}
          >
            -{p}%
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div>
          <label className="admin-label" style={{ fontSize: "12px" }}>Promo Price ($)</label>
          <input
            className="admin-input"
            type="number"
            step="0.01"
            placeholder="Sale price"
            value={salePrice}
            onChange={(e) => handlePriceChange(e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label" style={{ fontSize: "12px" }}>End Date</label>
          <input
            className="admin-input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ flex: 1 }}
        >
          💾 Save Promo
        </button>
        {isActive && (
          <button className="admin-btn admin-btn-danger" onClick={handleClear} disabled={saving}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

const EditPromotions: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSubcategory, setBulkSubcategory] = useState("");
  const [bulkPercent, setBulkPercent] = useState<number | "">("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkApplying, setBulkApplying] = useState(false);

  const fetchItems = async () => {
    try {
      const records = await pb.collection("items").getFullList<Item>({
        sort: "name",
        requestKey: null,
      });
      setItems(records);
      setCategories(Array.from(new Set(records.map((r) => r.category).filter(Boolean))));
    } catch (error: any) {
      if (!error.isAbort) console.error("Fetch items error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const availableSubcategories = useMemo(() => {
    if (!bulkCategory) return [];
    return Array.from(
      new Set(
        items
          .filter((i) => i.category === bulkCategory)
          .map((r) => r.subcategory)
          .filter(Boolean)
      )
    );
  }, [items, bulkCategory]);

  const handleBulkApply = async () => {
    if (!bulkCategory || !bulkPercent || !bulkEndDate) {
      return alert("Please select a category, discount percentage, and end date.");
    }
    if (!confirm(`Apply ${bulkPercent}% discount to selected category?`)) return;

    setBulkApplying(true);
    try {
      const targetItems = items.filter(
        (item) =>
          item.category === bulkCategory &&
          (bulkSubcategory ? item.subcategory === bulkSubcategory : true)
      );

      for (const item of targetItems) {
        if (item.price > 0) {
          const newPrice = item.price - (item.price * Number(bulkPercent)) / 100;
          await pb.collection("items").update(item.id as string, {
            sale_price: parseFloat(newPrice.toFixed(2)),
            sale_end_date: bulkEndDate,
          });
        }
      }
      alert(`Updated ${targetItems.length} products!`);
      fetchItems();
    } catch (err: any) {
      alert("Bulk update error: " + err.message);
    } finally {
      setBulkApplying(false);
    }
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredItems = term
    ? items.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term) ||
          item.subcategory?.toLowerCase().includes(term)
      )
    : items;

  if (loading) return <div className="admin-root">Loading promotions...</div>;

  return (
    <div className="admin-root">
      <div className="admin-header-container">
        <div>
          <button className="admin-btn admin-btn-back" onClick={() => navigate("/admin")} style={{ marginBottom: "16px" }}>
            ← Back to Dashboard
          </button>
          <h1 className="admin-title">🔥 Promotions & Flash Sales Manager</h1>
        </div>
      </div>

      {/* Bulk Campaign Launcher */}
      <div className="admin-card" style={{ background: "#fff8f8", borderColor: "#fecaca" }}>
        <h2 style={{ color: "#dc2626", marginTop: 0 }}>⚡ Launch Category-Wide Flash Sale</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "flex-end" }}>
          <div>
            <label className="admin-label">Category *</label>
            <select
              className="admin-input"
              value={bulkCategory}
              onChange={(e) => {
                setBulkCategory(e.target.value);
                setBulkSubcategory("");
              }}
            >
              <option value="">-- Select --</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Subcategory (Optional)</label>
            <select
              className="admin-input"
              value={bulkSubcategory}
              onChange={(e) => setBulkSubcategory(e.target.value)}
              disabled={!bulkCategory}
            >
              <option value="">-- All Subcategories --</option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Discount (%) *</label>
            <input
              className="admin-input"
              type="number"
              min="1"
              max="95"
              placeholder="20"
              value={bulkPercent}
              onChange={(e) => setBulkPercent(parseInt(e.target.value) || "")}
              style={{ width: "110px" }}
            />
          </div>

          <div>
            <label className="admin-label">Valid Until *</label>
            <input
              className="admin-input"
              type="date"
              value={bulkEndDate}
              onChange={(e) => setBulkEndDate(e.target.value)}
            />
          </div>

          <button className="admin-btn admin-btn-primary" onClick={handleBulkApply} disabled={bulkApplying}>
            {bulkApplying ? "Applying..." : "Apply Bulk Discount"}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          className="admin-input"
          type="search"
          placeholder="Filter products by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: "420px" }}
        />
      </div>

      <div className="admin-grid">
        {filteredItems.map((item) => (
          <PromotionCard key={item.id} item={item} onRefresh={fetchItems} />
        ))}
      </div>
    </div>
  );
};

export default EditPromotions;