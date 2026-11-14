// src/components/EditNews/EditNews.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../../pocketbaseClient";
import { NewsForm } from "./NewsForm";
import "../../AdminStyles.css";

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string;
  button_text?: string;
  button_url?: string;
  date?: string;
  created?: string;
}

const EditNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  const fetchNews = async () => {
    setLoading(true);
    try {
      const records = await pb.collection("news").getFullList<NewsItem>({
        sort: "-created",
        requestKey: null,
      });

      const withUrls = records.map((item) => {
        const fullImageUrl = item.image_url
          ? item.image_url.startsWith("http")
            ? item.image_url
            : pb.files.getURL(item as any, item.image_url)
          : "";
        return {
          ...item,
          image_url: fullImageUrl,
          created: item.created,
        };
      });

      setNews(withUrls);
    } catch (error: any) {
      if (!error?.isAbort) {
        console.error(error);
        alert("Failed to load news articles: " + (error?.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  function formatEnglishDate(iso?: string) {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (loading) {
    return (
      <div className="admin-root">
        <p style={{ color: "#64748b", fontWeight: 500 }}>Loading news articles…</p>
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
          <h1 className="admin-title">📰 News & Editorial Manager</h1>
        </div>
        {!adding && (
          <button className="admin-btn admin-btn-primary" onClick={() => setAdding(true)}>
            + Add New Article
          </button>
        )}
      </div>

      {adding && (
        <div className="admin-card" style={{ maxWidth: "1050px", marginBottom: "32px" }}>
          <NewsForm
            onCancel={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              fetchNews();
            }}
          />
        </div>
      )}

      {news.length === 0 && !adding ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
          <p style={{ fontSize: "16px", marginBottom: "16px" }}>No news articles published yet.</p>
          <button className="admin-btn admin-btn-primary" onClick={() => setAdding(true)}>
            + Create First Article
          </button>
        </div>
      ) : (
        <div className="admin-grid">
          {news.map((item) => (
            <div
              key={item.id}
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
              <div style={{ width: "100%", height: "210px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={() => console.error("Image load failed:", item.image_url)}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    No cover image
                  </div>
                )}
              </div>

              <div style={{ padding: "22px", display: "flex", flexDirection: "column", flex: 1 }}>
                {item.date && (
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
                    🗓 Published: {formatEnglishDate(item.created || item.date)}
                  </div>
                )}

                <h2 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: "19px", fontWeight: 700, lineHeight: 1.35 }}>
                  {item.title}
                </h2>
                <p style={{ margin: "0 0 18px", color: "#475569", fontSize: "14px", lineHeight: "1.6", flex: 1 }}>
                  {item.content}
                </p>

                {item.button_text && item.button_url && (
                  <a
                    href={item.button_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-secondary"
                    style={{ alignSelf: "flex-start", marginBottom: "16px", textDecoration: "none", fontSize: "13px" }}
                  >
                    🔗 {item.button_text} ↗
                  </a>
                )}

                <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => navigate(`/admin/news/edit/${item.id}`)}
                    style={{ flex: 1 }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this news article?")) return;
                      try {
                        await pb.collection("news").delete(item.id);
                        setNews((ns) => ns.filter((n) => n.id !== item.id));
                      } catch (error: any) {
                        alert("Delete error: " + (error?.message || "Unknown error"));
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

export default EditNews;