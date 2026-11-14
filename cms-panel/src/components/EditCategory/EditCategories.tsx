// src/components/EditCategory/EditCategories.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../../pocketbaseClient";
import CategoryForm from "./CategoryForm";
import type { Category } from "../../types/category";
import "../../AdminStyles.css";

const EditCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const records = await pb.collection("categories").getFullList<any>({ sort: "order" });
      let finalCategories = records.map((record) => ({
        id: record.id,
        key: record.key,
        label: record.label,
        order: record.order,
        sections:
          typeof record.sections === "string"
            ? JSON.parse(record.sections)
            : record.sections || [],
      }));

      if (finalCategories.length === 0) {
        const defaultCategories = [
          {
            key: "women",
            label: "Women's Fashion",
            order: 1,
            sections: [
              {
                label: "Clothing",
                subcategories: ["Dresses", "Skirts", "Jackets & Coats", "Trousers", "Shorts"],
              },
              {
                label: "Accessories",
                subcategories: ["Belts", "Handbags", "Scarves", "Hats & Caps", "Jewelry"],
              },
              {
                label: "Other",
                subcategories: ["Footwear", "Tights", "Underwear"],
              },
            ],
          },
          {
            key: "men",
            label: "Men's Fashion",
            order: 2,
            sections: [
              {
                label: "Clothing",
                subcategories: [
                  "Trousers", "Shorts", "Tracksuits", "Jackets & Coats", "Tops",
                  "Hoodies & Sweatshirts", "Sweaters & Knits", "T-Shirts", "Polos",
                  "Blazers", "Suit Sets", "Shirts", "Vests"
                ],
              },
              {
                label: "Accessories",
                subcategories: ["Belts", "Ties", "Bow Ties", "Scarves", "Hats & Caps", "Wallets"],
              },
              {
                label: "Underwear & Footwear",
                subcategories: ["Footwear", "Socks", "Briefs", "Boxers"],
              },
            ],
          },
          {
            key: "any",
            label: "Other",
            order: 3,
            sections: [
              {
                label: "Miscellaneous",
                subcategories: ["Accessories", "Add-ons", "Other"],
              },
            ],
          },
        ];

        for (const cat of defaultCategories) {
          await pb.collection("categories").create(cat);
        }

        const newRecords = await pb.collection("categories").getFullList<any>({ sort: "order" });
        finalCategories = newRecords.map((record) => ({
          id: record.id,
          key: record.key,
          label: record.label,
          order: record.order,
          sections:
            typeof record.sections === "string"
              ? JSON.parse(record.sections)
              : record.sections || [],
        }));
      }

      setCategories(finalCategories);
    } catch (err: any) {
      alert("Error loading categories: " + (err?.message || "Unknown error"));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) return <div className="admin-root">Loading categories...</div>;

  return (
    <div className="admin-root">
      <div className="admin-header-container">
        <div>
          <button className="admin-btn admin-btn-back" onClick={() => navigate("/admin")} style={{ marginBottom: "16px" }}>
            ← Back to Dashboard
          </button>
          <h1 className="admin-title">🗂️ Product Categories</h1>
        </div>
        {!adding && !editing && (
          <button className="admin-btn admin-btn-primary" onClick={() => setAdding(true)}>
            + Add New Category
          </button>
        )}
      </div>

      {(adding || editing) && (
        <div className="admin-card">
          <CategoryForm
            editingCategory={editing}
            onCancel={() => {
              setAdding(false);
              setEditing(null);
            }}
            onSaved={() => {
              setAdding(false);
              setEditing(null);
              fetchCategories();
            }}
          />
        </div>
      )}

      {!adding && !editing && (
        <div className="admin-grid">
          {categories.map((category) => (
            <div key={category.id} className="admin-card" style={{ marginBottom: 0 }}>
              <h2 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>{category.label}</h2>
              <div style={{ color: "#475569", marginBottom: 8, fontSize: "14px" }}>
                System Key: <strong style={{ color: "#0f172a" }}>{category.key}</strong>
              </div>
              <div style={{ color: "#475569", marginBottom: 8, fontSize: "14px" }}>
                Sections Count: <strong style={{ color: "#0f172a" }}>{category.sections.length}</strong>
              </div>
              <div style={{ color: "#475569", marginBottom: 20, fontSize: "14px" }}>
                Display Order: <strong style={{ color: "#0f172a" }}>{category.order}</strong>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button className="admin-btn admin-btn-secondary" onClick={() => setEditing(category)} style={{ flex: 1 }}>
                  ✏️ Edit
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={async () => {
                    if (!confirm("Delete this category?")) return;
                    try {
                      await pb.collection("categories").delete(String(category.id));
                      fetchCategories();
                    } catch (err: any) {
                      alert("Delete error: " + (err?.message || "Unknown error"));
                    }
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditCategories;