// src/components/EditSection/EditSections.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../../pocketbaseClient";
import SectionForm from "./SectionForm";
import { type Section } from "../../types/section";
import "../../AdminStyles.css";

const EditSections: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  const fetchSections = async () => {
    setLoading(true);
    try {
      const records = await pb.collection("sections").getFullList<Section>({
        sort: "order",
        requestKey: null,
      });
      setSections(records);
    } catch (error: any) {
      if (!error?.isAbort) {
        console.error(error);
        alert("Failed to load homepage sections: " + (error?.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const getPreviewUrl = (s: Section) => {
    if (!s.image_path) return "";
    if (s.image_path.startsWith("http")) return s.image_path;
    return `${pb.baseUrl}/api/files/sections/${s.id}/${s.image_path}`;
  };

  if (loading) {
    return (
      <div className="admin-root">
        <p style={{ color: "#64748b", fontWeight: 500 }}>Loading homepage sections…</p>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <div className="admin-header-container">
        <div>
          <button
            className="admin-btn admin-btn-back"
            onClick={() => navigate("/admin")}
            style={{ marginBottom: "16px" }}
          >
            ← Back to Dashboard
          </button>
          <h1 className="admin-title">🖼️ Homepage Hero & Sections</h1>
        </div>
        {!adding && (
          <button className="admin-btn admin-btn-primary" onClick={() => setAdding(true)}>
            + Add New Section
          </button>
        )}
      </div>

      {adding && (
        <div className="admin-card" style={{ maxWidth: "1100px", marginBottom: "32px" }}>
          <SectionForm
            onCancel={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              fetchSections();
            }}
          />
        </div>
      )}

      {sections.length === 0 && !adding ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
          <p style={{ fontSize: "16px", marginBottom: "16px" }}>No homepage sections configured yet.</p>
          <button className="admin-btn admin-btn-primary" onClick={() => setAdding(true)}>
            + Create First Section
          </button>
        </div>
      ) : (
        <div className="admin-grid">
          {sections.map((s) => (
            <div
              key={s.id}
              className="admin-card"
              style={{
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
              }}
            >
              <img
                src={getPreviewUrl(s) || "/placeholder.png"}
                alt={s.title}
                style={{
                  width: "100%",
                  height: "210px",
                  objectFit: "cover",
                  borderBottom: "1px solid #e2e8f0",
                }}
              />
              <div style={{ padding: "22px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#2563eb",
                    marginBottom: "8px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  🔢 Display Order: #{s.order}
                </div>

                <h2 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: "19px", fontWeight: 700 }}>
                  {s.title}
                </h2>
                <p style={{ margin: "0 0 18px", color: "#475569", fontSize: "14px", lineHeight: "1.6", flex: 1 }}>
                  {s.subtitle}
                </p>

                <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => navigate(`/admin/sections/edit/${s.id}`)}
                    style={{ flex: 1 }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this homepage section?")) return;
                      try {
                        await pb.collection("sections").delete(String(s.id));
                        fetchSections();
                      } catch (err: any) {
                        alert("Delete error: " + (err?.message || "Unknown error"));
                      }
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditSections;