import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import pb from "../../api/pocketbase";

interface CategorySection {
  label: string;
  subcategories: string[];
}

type Category = {
  label: string;
  key: string;
  sections: CategorySection[];
  order: number;
};

interface Props {
  selected: { [k: string]: boolean };
  onChange: (subcategoryKey: string, checked: boolean) => void;
  onClearFilters: () => void;
  sortOrder: "" | "asc" | "desc" | "a-z" | "z-a";
  onSortChange: (order: "" | "asc" | "desc" | "a-z" | "z-a") => void;
}

export const Categories: React.FC<Props> = ({
  selected,
  onChange,
  onClearFilters,
  sortOrder,
  onSortChange,
}) => {
  const [open, setOpen] = useState<{ [k: string]: boolean }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      const records = await pb.collection("categories").getFullList<any>({ sort: "order" });
      const newCategories = records
        .map((record) => ({
          label: record.label,
          key: record.key,
          sections:
            typeof record.sections === "string"
              ? JSON.parse(record.sections)
              : record.sections || [],
          order: record.order ?? 0,
        }))
        .sort((a, b) => a.order - b.order);

      setCategories(newCategories);
      // Open first category by default for better UX
      if (newCategories.length > 0) {
        setOpen((prev) => (Object.keys(prev).length === 0 ? { [newCategories[0].key]: true } : prev));
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    const interval = setInterval(loadCategories, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading categories...</div>;
  }

  if (categories.length === 0) {
    return <div style={{ color: "#64748b", fontSize: "0.9rem" }}>No categories available</div>;
  }

  const isAnySelected = Object.values(selected).some(Boolean);

  return (
    <div className="categories-filter-panel">
      {/* Sort & Reset Controls */}
      <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em" }}>
            Sort Catalog By
          </label>
          <select
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value as any)}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#f8fafc",
              fontSize: "0.92rem",
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Featured (Default)</option>
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
            <option value="a-z">Name: A to Z</option>
            <option value="z-a">Name: Z to A</option>
          </select>
        </div>

        <button
          onClick={onClearFilters}
          disabled={!isAnySelected && !sortOrder}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: isAnySelected || sortOrder ? "#fee2e2" : "#f1f5f9",
            color: isAnySelected || sortOrder ? "#dc2626" : "#94a3b8",
            border: "none",
            borderRadius: "10px",
            cursor: isAnySelected || sortOrder ? "pointer" : "not-allowed",
            fontWeight: 700,
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
        >
          <RotateCcw size={15} /> Reset All Filters
        </button>
      </div>

      {/* Category Accordion Tree */}
      <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em", marginBottom: "12px" }}>
        Product Categories
      </div>

      {categories.map((cat) => {
        const isOpen = !!open[cat.key];
        return (
          <div key={cat.key} style={{ marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
            <div
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#0f172a",
                padding: "8px 6px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onClick={() => setOpen((o) => ({ ...o, [cat.key]: !o[cat.key] }))}
            >
              <span>{cat.label}</span>
              {isOpen ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
            </div>

            {isOpen && (
              <div style={{ paddingLeft: "10px", marginTop: "6px", marginBottom: "8px" }}>
                {cat.sections.map((section) => (
                  <div key={section.label} style={{ marginBottom: "14px" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: "#2563eb",
                        margin: "6px 0 8px 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {section.label}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      {section.subcategories.map((sub) => {
                        const key = `${cat.key}-${sub.toLowerCase()}`;
                        const checked = !!selected[key];
                        return (
                          <label
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                              fontSize: "0.92rem",
                              color: checked ? "#0f172a" : "#475569",
                              fontWeight: checked ? 600 : 400,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => onChange(key, e.target.checked)}
                              style={{ marginRight: 10, width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer" }}
                            />
                            {sub}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};