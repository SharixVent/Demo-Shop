// src/components/EditSection/EditSectionLoader.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pb } from "../../pocketbaseClient";
import { type Section } from "../../types/section";
import SectionForm from "./SectionForm";
import "../../AdminStyles.css";

const EditSectionLoader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/admin/sections", { replace: true });
      return;
    }

    (async () => {
      try {
        const record = await pb.collection("sections").getOne<Section>(id, { requestKey: null });
        setSection(record);
      } catch (error: any) {
        if (!error?.isAbort) {
          console.error(error);
          alert("Failed to load homepage section: " + (error?.message || "Unknown error"));
          navigate("/admin/sections", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="admin-root">
        <p style={{ color: "#64748b", fontWeight: 500 }}>Loading section…</p>
      </div>
    );
  }
  if (!section) return null;

  return (
    <div className="admin-root">
      <div className="admin-header-container">
        <div>
          <button
            className="admin-btn admin-btn-back"
            onClick={() => navigate("/admin/sections")}
            style={{ marginBottom: "16px" }}
          >
            ← Back to Sections
          </button>
          <h1 className="admin-title">
            Editing Section: <span style={{ color: "#2563eb" }}>{section.title}</span>
          </h1>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: "1100px" }}>
        <SectionForm
          editingSection={section}
          onCancel={() => navigate("/admin/sections")}
          onSaved={() => navigate("/admin/sections")}
        />
      </div>
    </div>
  );
};

export default EditSectionLoader;