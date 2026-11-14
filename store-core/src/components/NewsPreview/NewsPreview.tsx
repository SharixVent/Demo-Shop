import React, { useEffect, useState } from "react";
import pb from "../../api/pocketbase";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string;
  created?: string;
  button_text?: string;
  button_url?: string;
}

const NewsPreview: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Latest News & Lookbooks | DemoShop";
    (async () => {
      try {
        const list = await pb.collection("news").getFullList({
          sort: "-created",
        });

        const mapped = list.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          image_url: item.image_url ? pb.files.getURL(item, item.image_url) : "",
          created: item.created,
          button_text: item.button_text,
          button_url: item.button_url,
        }));

        setNews(mapped);
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    })();
  }, []);

  function formatEnglishDate(iso?: string) {
    if (!iso) return "";
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  return (
    <div style={{ minHeight: "85vh", fontFamily: '"Inter", sans-serif' }}>
      <style>
        {`
          .news-grid-exact {
            display: grid;
            gap: 32px;
            grid-template-columns: 1fr;
          }
          @media (min-width: 768px) {
            .news-grid-exact {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (min-width: 1024px) {
            .news-grid-exact {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}
      </style>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span
            style={{
              display: "inline-block",
              background: "#eff6ff",
              color: "#2563eb",
              fontWeight: 700,
              fontSize: "0.75rem",
              padding: "5px 12px",
              borderRadius: "999px",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            DEMOSHOP EDITORIAL
          </span>
          <h1 style={{ fontSize: "2.4rem", color: "#0f172a", fontWeight: 800, margin: "0 0 14px 0" }}>
            News & Seasonal Lookbooks
          </h1>
          <p style={{ fontSize: "1.05rem", color: "#64748b", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            Discover our newest collections, upcoming store events, and behind-the-scenes updates from DemoShop.
          </p>
        </div>

        <div className="news-grid-exact">
          {news.map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <article
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: isHovered
                    ? "0 20px 35px -10px rgba(15, 23, 42, 0.12)"
                    : "0 4px 15px rgba(15, 23, 42, 0.04)",
                  transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                  transition: "all 0.3s ease",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "260px",
                      objectFit: "contain",
                      padding: "12px",
                      boxSizing: "border-box",
                      transform: isHovered ? "scale(1.04)" : "scale(1)",
                      transition: "transform 0.45s ease",
                      display: "block",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px" }}>
                  {item.created && (
                    <time
                      style={{
                        fontSize: "0.78rem",
                        color: "#2563eb",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "10px",
                      }}
                    >
                      {formatEnglishDate(item.created)}
                    </time>
                  )}

                  <h2
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: "0 0 12px 0",
                      lineHeight: "1.35",
                    }}
                  >
                    {item.title}
                  </h2>

                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "#475569",
                      lineHeight: "1.65",
                      margin: "0 0 20px 0",
                      flex: 1,
                    }}
                  >
                    {item.content}
                  </p>

                  {item.button_text && item.button_url && (
                    <a
                      href={item.button_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "0.92rem",
                        fontWeight: 700,
                        color: "#2563eb",
                        textDecoration: "none",
                        marginTop: "auto",
                      }}
                    >
                      {item.button_text}
                      <span
                        style={{
                          marginLeft: "6px",
                          transform: isHovered ? "translateX(5px)" : "translateX(0)",
                          transition: "transform 0.25s ease",
                        }}
                      >
                        →
                      </span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NewsPreview;