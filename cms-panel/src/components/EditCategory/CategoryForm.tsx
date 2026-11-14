import React, { useEffect, useState } from "react";
import { pb } from "../../pocketbaseClient";
import type { Category, CategorySection } from "../../types/category";

type Props = {
  editingCategory: Category | null;
  onCancel: () => void;
  onSaved: () => void;
};

const emptySection = (): CategorySection & { newSubcategory: string } => ({
  label: "",
  subcategories: [],
  newSubcategory: "",
});

const CategoryForm: React.FC<Props> = ({ editingCategory, onCancel, onSaved }) => {
  const [label, setLabel] = useState(editingCategory?.label || "");
  const [key, setKey] = useState(editingCategory?.key || "");
  const [order, setOrder] = useState(editingCategory?.order ?? 1);
  const [sections, setSections] = useState<(CategorySection & { newSubcategory: string })[]>(
    (editingCategory?.sections || []).map((section) => ({
      ...section,
      newSubcategory: "",
    })) || [emptySection()]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setLabel(editingCategory.label);
      setKey(editingCategory.key);
      setOrder(editingCategory.order);
      setSections(
        editingCategory.sections?.map((section) => ({
          ...section,
          newSubcategory: "",
        })) || [emptySection()]
      );
    } else {
      setLabel("");
      setKey("");
      setOrder(1);
      setSections([emptySection()]);
    }
  }, [editingCategory]);

  const handleSectionChange = (
    index: number,
    field: keyof CategorySection,
    value: string
  ) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx !== index ? section : { ...section, [field]: value }
      )
    );
  };

  const handleRemoveSection = (index: number) => {
    setSections((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddSection = () => {
    setSections((prev) => [...prev, emptySection()]);
  };

  const handleSubcategoryInputChange = (index: number, value: string) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx !== index ? section : { ...section, newSubcategory: value }
      )
    );
  };

  const handleAddSubcategory = (index: number) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== index) return section;
        const value = section.newSubcategory.trim();
        if (!value || section.subcategories.includes(value)) return section;
        return {
          ...section,
          subcategories: [...section.subcategories, value],
          newSubcategory: "",
        };
      })
    );
  };

  const handleRemoveSubcategory = (sectionIndex: number, subcategory: string) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx !== sectionIndex
          ? section
          : {
              ...section,
              subcategories: section.subcategories.filter((sub) => sub !== subcategory),
            }
      )
    );
  };

  const normalizedSections = sections
    .map(({ label: sectionLabel, subcategories }) => ({
      label: sectionLabel,
      subcategories,
    }))
    .filter((section) => section.label.trim() !== "" || section.subcategories.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!label.trim() || !key.trim()) {
      alert("Uzupełnij nazwę i identyfikator kategorii.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        label: label.trim(),
        key: key.trim(),
        order,
        sections: normalizedSections,
      };

      if (editingCategory?.id) {
        await pb.collection("categories").update(editingCategory.id, payload);
      } else {
        await pb.collection("categories").create(payload);
      }

      onSaved();
    } catch (err: any) {
      console.error(err);
      alert("Błąd zapisu kategorii: " + (err?.message || "nieznany błąd"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ marginTop: 0, marginBottom: "24px" }}>
        {editingCategory ? "✏️ Edytuj kategorię" : "➕ Nowa kategoria"}
      </h2>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <div>
          <label className="admin-label">Nazwa kategorii</label>
          <input className="admin-input" value={label} onChange={(e) => setLabel(e.target.value)} required />
        </div>
        <div>
          <label className="admin-label">Klucz kategorii (np. women)</label>
          <input className="admin-input" value={key} onChange={(e) => setKey(e.target.value)} required />
        </div>
        <div>
          <label className="admin-label">Kolejność (1, 2, 3...)</label>
          <input className="admin-input" type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>Struktura menu (Sekcje)</h3>
        
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="admin-card-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <strong style={{ fontSize: "16px" }}>Sekcja {sectionIndex + 1}</strong>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleRemoveSection(sectionIndex)}>
                🗑️ Usuń sekcję
              </button>
            </div>

            <label className="admin-label">Nazwa sekcji (np. Odzież)</label>
            <input className="admin-input" value={section.label} onChange={(e) => handleSectionChange(sectionIndex, "label", e.target.value)} style={{ marginBottom: "16px" }} />

            <div>
              <label className="admin-label">Podkategorie w tej sekcji</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                {section.subcategories.map((subcategory) => (
                  <span key={subcategory} className="category-tag">
                    {subcategory}
                    <span 
                      style={{ cursor: "pointer", color: "#ef4444", fontWeight: "bold", marginLeft: "4px" }} 
                      onClick={() => handleRemoveSubcategory(sectionIndex, subcategory)}
                    >
                      ×
                    </span>
                  </span>
                ))}
                {section.subcategories.length === 0 && <span style={{ color: "#94a3b8", fontSize: "14px" }}>Brak podkategorii</span>}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  className="admin-input" 
                  value={section.newSubcategory} 
                  onChange={(e) => handleSubcategoryInputChange(sectionIndex, e.target.value)} 
                  placeholder="Wpisz nową podkategorię (np. Sukienki)" 
                />
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => handleAddSubcategory(sectionIndex)}>
                  + Dodaj
                </button>
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="admin-btn admin-btn-success" onClick={handleAddSection} style={{ marginTop: "8px" }}>
          + Utwórz nową sekcję
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
          {saving ? "⏳ Zapisywanie…" : "💾 Zapisz kategorię"}
        </button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel} disabled={saving}>
          ✕ Anuluj
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;