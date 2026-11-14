// src/components/EditItem/ItemForm.tsx
import React, { useEffect, useState, useMemo } from "react";
import type { Item } from "../../types/item";
import type { CategorySection } from "../../types/category";
import { pb } from "../../pocketbaseClient";
import { FileReorder } from "./FilePicker";
import "../../AdminStyles.css";

interface Props {
  editingItem: Item | null;
  onSaved: () => void;
}

const ItemForm: React.FC<Props> = ({ editingItem, onSaved }) => {
  const [title, setTitle] = useState(editingItem?.name || "");
  const [category, setCategory] = useState(editingItem?.category || "");
  const [subcategory, setSubcategory] = useState(editingItem?.subcategory || "");
  const [sizes, setSizes] = useState<string[]>(
    editingItem?.sizes.map((s) => s.toUpperCase()) || []
  );
  const [sizeInput, setSizeInput] = useState("");
  const [price, setPrice] = useState<number>(editingItem?.price ?? 0);
  const [description, setDescription] = useState<string>(editingItem?.description || "");
  const [material, setMaterial] = useState<string>(editingItem?.material || "");
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<
    { label: string; key: string; sections: CategorySection[] }[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [files, setFiles] = useState<(File | string)[]>(editingItem?.images || []);

  useEffect(() => {
    let active = true;
    pb.collection("categories")
      .getFullList<any>({ sort: "order", requestKey: null })
      .then((records) => {
        if (!active) return;
        setCategories(
          records
            .map((record) => ({
              label: record.label,
              key: record.key,
              sections:
                typeof record.sections === "string"
                  ? JSON.parse(record.sections)
                  : record.sections || [],
              order: record.order ?? 0,
            }))
            .sort((a, b) => a.order - b.order)
        );
      })
      .catch((err) => {
        if (!err.isAbort) console.error("Failed to load categories:", err);
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAddSize = () => {
    const up = sizeInput.trim().toUpperCase();
    if (up && !sizes.includes(up)) {
      setSizes((prev) => [...prev, up]);
    }
    setSizeInput("");
  };

  const applySizePreset = (preset: string[]) => {
    const merged = Array.from(new Set([...sizes, ...preset]));
    setSizes(merged);
  };

  const handleRemoveSize = (sz: string) =>
    setSizes((prev) => prev.filter((s) => s !== sz));

  // Auto-generate rich SEO description template
  const handleGenerateSeoTemplate = () => {
    const itemName = title.trim() || "Premium Garment";
    const sub = subcategory || category || "Apparel";
    const mat = material.trim() || "100% high-grade breathable fabric";
    const generated = `Elevate your wardrobe with the ${itemName} from DemoShop's ${sub} collection.\n\nCrafted from ${mat}, this piece delivers exceptional durability, a modern tailored silhouette, and all-day comfort. Ideal for both casual everyday styling and smart layering.\n\nKey Features:\n• Premium quality stitching and colorfast finish\n• Breathable, skin-friendly texture\n• Available in sizes: ${sizes.join(", ") || "S, M, L, XL"}\n• Fast dispatch & 30-day hassle-free return guarantee`;
    setDescription(generated);
  };

  // Yoast-style Live SEO Score Calculation
  const seoAnalysis = useMemo(() => {
    let score = 0;
    const tips: string[] = [];

    if (title.trim().length >= 10 && title.trim().length <= 65) {
      score += 25;
    } else {
      tips.push("Product title should be between 10 and 60 characters for optimal Google display.");
    }

    if (description.trim().length >= 120) {
      score += 30;
    } else {
      tips.push("Add at least 120 characters to the description to rank for long-tail keywords.");
    }

    if (material.trim().length >= 4) {
      score += 20;
    } else {
      tips.push("Specify fabric/material composition (improves Google Shopping rich snippets).");
    }

    if (files.length >= 1) {
      score += 15;
    } else {
      tips.push("Upload at least 1 product image.");
    }

    if (files.length >= 2) {
      score += 10;
    } else {
      tips.push("Add a 2nd photo to enable hover image swap in the catalog.");
    }

    const slug = (title || "product")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return { score, tips, slug };
  }, [title, description, material, files]);

  const handleClear = () => {
    setTitle(editingItem?.name || "");
    setCategory(editingItem?.category || "");
    setSubcategory(editingItem?.subcategory || "");
    setSizes(editingItem?.sizes.map((s) => s.toUpperCase()) || []);
    setSizeInput("");
    setFiles(editingItem?.images || []);
    setPrice(editingItem?.price ?? 0);
    setDescription(editingItem?.description || "");
    setMaterial(editingItem?.material || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Product title is required.");
    if (!category) return alert("Category is required.");
    if (!subcategory) return alert("Subcategory is required.");
    if (sizes.length === 0) return alert("Please add at least one size.");
    if (price < 0) return alert("Price cannot be negative.");

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", title);
      formData.append("category", category);
      formData.append("subcategory", subcategory);
      formData.append("sizes", JSON.stringify(sizes));

      const safePrice = isNaN(price) ? 0 : Number(price);
      formData.append("price", safePrice.toString());

      if (description) formData.append("description", description);
      if (material) formData.append("material", material);

      if (files.length === 0) {
        formData.append("images", "");
      } else {
        files.forEach((file) => {
          formData.append("images", file);
        });
      }

      if (editingItem?.id) {
        await pb.collection("items").update(editingItem.id, formData);
      } else {
        await pb.collection("items").create(formData);
      }

      onSaved();
    } catch (err: any) {
      console.error("Item save error:", err);
      const errorMsg = err?.response?.data || err?.message || "Unknown error";
      alert(
        "Error saving product:\n" +
          (typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg, null, 2))
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedCat = categories.find((c) => c.key === category);
  const seoColor =
    seoAnalysis.score >= 80 ? "#16a34a" : seoAnalysis.score >= 50 ? "#d97706" : "#dc2626";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "14px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: "1.35rem" }}>
          {editingItem ? `✏️ Edit: ${editingItem.name}` : "➕ Add New Product"}
        </h2>
        <span
          style={{
            background: `${seoColor}15`,
            color: seoColor,
            border: `1px solid ${seoColor}40`,
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "0.78rem",
            fontWeight: 800,
          }}
        >
          SEO Score: {seoAnalysis.score}/100
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label className="admin-label">Product Title (H1 & Meta Title) *</label>
          <input
            className="admin-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Classic Tailored Merino Wool Coat"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label className="admin-label">Department / Category *</label>
            <select
              className="admin-input"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory("");
              }}
              required
              disabled={loadingCategories}
            >
              <option value="">{loadingCategories ? "Loading..." : "-- Select --"}</option>
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Subcategory *</label>
            <select
              className="admin-input"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              required
              disabled={loadingCategories || !category}
            >
              <option value="">
                {!category ? "Select category first" : "-- Select --"}
              </option>
              {selectedCat?.sections.map((sec) => (
                <optgroup key={sec.label} label={sec.label}>
                  {sec.subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label className="admin-label">Base Price ($) *</label>
          <input
            className="admin-input"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            required
            style={{ maxWidth: "180px" }}
          />
        </div>

        {/* Sizes with 1-Click Presets */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label className="admin-label" style={{ margin: 0 }}>Available Sizes *</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => applySizePreset(["S", "M", "L", "XL"])}
                style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
              >
                + S–XL
              </button>
              <button
                type="button"
                onClick={() => applySizePreset(["XS", "S", "M", "L", "XL", "XXL"])}
                style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
              >
                + XS–XXL
              </button>
              <button
                type="button"
                onClick={() => applySizePreset(["ONE SIZE"])}
                style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
              >
                + One Size
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
              padding: "12px",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
            }}
          >
            {sizes.map((sz) => (
              <span key={sz} className="category-tag">
                {sz}
                <button
                  type="button"
                  onClick={() => handleRemoveSize(sz)}
                  style={{
                    color: "#dc2626",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                    padding: 0,
                  }}
                  title="Remove size"
                >
                  ✕
                </button>
              </span>
            ))}

            <div style={{ display: "flex", gap: "6px" }}>
              <input
                className="admin-input"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                style={{ padding: "6px 10px", width: "95px" }}
                placeholder="e.g. 42"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSize())}
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="admin-btn admin-btn-secondary"
                style={{ padding: "6px 12px" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Material */}
        <div style={{ marginBottom: "16px" }}>
          <label className="admin-label">Material & Fabric Composition</label>
          <input
            className="admin-input"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="e.g. 80% Organic Cotton, 20% Recycled Polyester"
          />
        </div>

        {/* Description + Auto-SEO Template Generator */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label className="admin-label" style={{ margin: 0 }}>
              Product Description (SEO Copy)
            </label>
            <button
              type="button"
              onClick={handleGenerateSeoTemplate}
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                color: "#2563eb",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✨ Auto-Generate SEO Description
            </button>
          </div>
          <textarea
            className="admin-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            style={{ resize: "vertical" }}
            placeholder="Write a detailed product description including fit, styling tips, and key benefits..."
          />
        </div>

        {/* Product Photos */}
        <div style={{ marginBottom: "18px" }}>
          <label className="admin-label">Product Gallery (Drag & Drop to Reorder)</label>
          <div
            style={{
              padding: "14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
            }}
          >
            {files.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <FileReorder files={files} onReorder={setFiles} itemRef={editingItem} />
              </div>
            )}

            <input
              type="file"
              multiple
              accept="image/*"
              className="policy-upload-input"
              onChange={(e) => {
                if (e.target.files) {
                  setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
            />

            {files.length > 0 && (
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => setFiles([])}
                style={{ marginTop: "10px", padding: "6px 12px", fontSize: "12px" }}
              >
                Clear All Photos
              </button>
            )}
          </div>
        </div>

        {/* Yoast SEO Google SERP Live Preview */}
        <div className="seo-widget-box">
          <div style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", color: "#475569", marginBottom: "10px" }}>
            🔍 Google Search Engine Preview (SERP)
          </div>
          <div className="serp-preview-card">
            <div className="serp-url">
              https://example.com › collections › {seoAnalysis.slug}
            </div>
            <div className="serp-title">
              {title ? `${title} | DemoShop Official Store` : "Product Title | DemoShop Official Store"}
            </div>
            <p className="serp-desc">
              {description
                ? description.slice(0, 155) + (description.length > 155 ? "..." : "")
                : "Shop high-quality apparel and accessories at DemoShop. Fast express shipping and 30-day returns."}
            </p>
          </div>

          {seoAnalysis.tips.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
              {seoAnalysis.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: "24px", display: "flex", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ flex: 1 }}>
            {saving ? "Saving..." : editingItem ? "💾 Update Product" : "➕ Publish Product"}
          </button>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={handleClear} disabled={saving}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;