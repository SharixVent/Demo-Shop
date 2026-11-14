// src/components/EditNews/EditNewsLoader.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pb } from "../../pocketbaseClient";
import type { NewsItem } from "../../types/news";
import { NewsForm } from "./NewsForm";
import "../../AdminStyles.css";

export const EditNewsLoader: React.FC<{ onSaved: () => void }> = ({ onSaved }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/admin/news", { replace: true });
      return;
    }

    (async () => {
      try {
        const record = await pb.collection("news").getOne<NewsItem>(id, { requestKey: null });
        setItem(record);
      } catch (error: any) {
        if (!error?.isAbort) {
          console.error(error);
          alert("Failed to load article: " + (error?.message || "Unknown error"));
          navigate("/admin/news", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="admin-root">
        <p style={{ color: "#64748b", fontWeight: 500 }}>Loading article details…</p>
      </div>
    );
  }
  if (!item) return null;

  return (
    <div className="admin-root">
      <div className="admin-header-container">
        <div>
          <button
            className="admin-btn admin-btn-back"
            onClick={() => navigate("/admin/news")}
            style={{ marginBottom: "16px" }}
          >
            ← Back to News
          </button>
          <h1 className="admin-title">
            Editing Article: <span style={{ color: "#2563eb" }}>{item.title}</span>
          </h1>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: "1050px" }}>
        <NewsForm
          editingItem={item}
          onCancel={() => navigate("/admin/news")}
          onSaved={() => {
            onSaved();
            navigate("/admin/news");
          }}
        />
      </div>
    </div>
  );
};

export default EditNewsLoader;