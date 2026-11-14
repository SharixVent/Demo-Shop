// src/components/EditNews/NewsForm.tsx
import React, { useState, useEffect, useRef } from "react";
import { pb } from "../../pocketbaseClient";
import type { NewsItem } from "../../types/news";

export interface NewsFormProps {
  editingItem?: NewsItem | null;
  onCancel: () => void;
  onSaved: () => void;
}

export const NewsForm: React.FC<NewsFormProps> = ({
  editingItem = null,
  onCancel,
  onSaved,
}) => {
  const [title, setTitle] = useState(editingItem ? editingItem.title : "");
  const [content, setContent] = useState(editingItem ? editingItem.content : "");
  const [file, setFile] = useState<File | null>(null);
  const [buttonText, setButtonText] = useState(editingItem?.button_text || "");
  const [buttonUrl, setButtonUrl] = useState(editingItem?.button_url || "");
  const [includeDate, setIncludeDate] = useState<boolean>(editingItem ? !!editingItem.date : true);

  const [linkType, setLinkType] = useState<"internal" | "external">(
    editingItem?.button_url && editingItem.button_url.startsWith("http")
      ? "external"
      : "internal"
  );
  const [saving, setSaving] = useState(false);
  const [previewImgUrl, setPreviewImgUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setContent(editingItem.content);
      setButtonText(editingItem.button_text || "");
      setButtonUrl(editingItem.button_url || "");
      setLinkType(
        editingItem.button_url && editingItem.button_url.startsWith("http")
          ? "external"
          : "internal"
      );
      setIncludeDate(!!editingItem.date);
    }
  }, [editingItem]);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImgUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (editingItem && editingItem.image_url) {
      if (editingItem.image_url.startsWith("http")) {
        setPreviewImgUrl(editingItem.image_url);
      } else {
        try {
          const fullUrl = pb.files.getURL(editingItem as any, editingItem.image_url);
          setPreviewImgUrl(fullUrl);
        } catch {
          setPreviewImgUrl("");
        }
      }
    } else {
      setPreviewImgUrl("");
    }
  }, [file, editingItem]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      setFile(fileList[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
      } else {
        alert("Please drop a valid image file (PNG, JPG, WEBP).");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!editingItem && !file) {
        alert("Please upload a cover image for the article.");
        setSaving(false);
        return;
      }

      const baseData: any = {
        title,
        content,
        button_text: buttonText || null,
        button_url: buttonUrl || null,
        date: includeDate ? new Date().toISOString().slice(0, 10) : null,
      };

      if (editingItem && editingItem.id) {
        if (file) {
          const formData = new FormData();
          Object.entries(baseData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              formData.append(key, String(value));
            }
          });
          formData.append("image_url", file);
          await pb.collection("news").update(editingItem.id, formData);
        } else {
          await pb.collection("news").update(editingItem.id, baseData);
        }
      } else {
        const formData = new FormData();
        Object.entries(baseData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        formData.append("image_url", file as File);
        await pb.collection("news").create(formData);
      }

      onSaved();
    } catch (err: any) {
      console.error("PocketBase error:", err);
      const msg = (err && err.message) || "Unknown error";
      alert("Error saving article: " + msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="news-form-layout-container">
      <style>
        {`
        .news-form-layout-container {
          display: flex;
          gap: 40px;
          flex-direction: column;
          width: 100%;
        }
        .news-form-column-left {
          flex: 12;
          min-width: 0;
        }
        .news-form-column-right {
          flex: 10;
          min-width: 320px;
          max-width: 420px;
          position: sticky;
          top: 24px;
        }
        .admin-dropzone {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 28px 20px;
          text-align: center;
          background-color: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .admin-dropzone:hover, .admin-dropzone.dragging {
          border-color: #2563eb;
          background-color: #eff6ff;
        }
        @media (min-width: 1024px) {
          .news-form-layout-container {
            flex-direction: row;
            align-items: flex-start;
          }
        }
        @media (max-width: 1023px) {
          .news-form-column-right {
            display: none;
          }
        }
        `}
      </style>

      {/* LEFT COLUMN: ARTICLE FORM */}
      <div className="news-form-column-left">
        <form onSubmit={handleSubmit}>
          <h2 style={{ marginTop: 0, marginBottom: "24px", color: "#0f172a" }}>
            {editingItem ? "✏️ Edit News Article" : "📰 Publish New Article"}
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <label className="admin-label">Article Title*</label>
            <input
              className="admin-input"
              placeholder="e.g. Why 480 GSM Organic Cotton Changes Everything"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label className="admin-label">Article Content*</label>
            <textarea
              className="admin-input"
              placeholder="Write the main story or announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* DRAG & DROP IMAGE UPLOAD */}
          <div style={{ marginBottom: "20px" }}>
            <label className="admin-label" style={{ marginBottom: "8px", display: "block" }}>
              Cover Image{" "}
              {editingItem && (
                <span style={{ color: "#64748b", fontWeight: "normal" }}>
                  (drop or select a new file only if you want to replace the current image)
                </span>
              )}
            </label>

            <div
              className={`admin-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📤</div>
              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "14px", marginBottom: "4px" }}>
                {file
                  ? `Selected: ${file.name}`
                  : "Drag & drop an image here, or click to browse"}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Supports JPG, PNG, WEBP (Recommended 16:9 ratio)
              </div>

              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{
                    marginTop: "10px",
                    padding: "4px 12px",
                    fontSize: "12px",
                    borderRadius: "6px",
                    border: "1px solid #fca5a5",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✕ Remove selected file
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label className="admin-label">Button Label (Optional)</label>
              <input
                className="admin-input"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g. Explore the Capsule"
              />
            </div>
            <div>
              <label className="admin-label">Button Destination URL</label>
              <input
                className="admin-input"
                type={linkType === "internal" ? "text" : "url"}
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder={
                  linkType === "internal" ? "e.g. /collections" : "e.g. https://example.com"
                }
              />
            </div>
          </div>

          <fieldset style={{ border: "none", padding: 0, margin: "0 0 20px 0" }}>
            <legend className="admin-label" style={{ marginBottom: "8px" }}>
              Link Destination Type
            </legend>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#334155",
                }}
              >
                <input
                  type="radio"
                  name="linkType"
                  value="internal"
                  checked={linkType === "internal"}
                  onChange={() => setLinkType("internal")}
                />
                Internal (Storefront route)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#334155",
                }}
              >
                <input
                  type="radio"
                  name="linkType"
                  value="external"
                  checked={linkType === "external"}
                  onChange={() => setLinkType("external")}
                />
                External (Website, Instagram, etc.)
              </label>
            </div>
          </fieldset>

          <div
            style={{
              marginBottom: "24px",
              padding: "14px 16px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: 600,
                color: "#166534",
              }}
            >
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              Display publication date on the article card
            </label>
            {includeDate && (
              <div style={{ fontSize: 13, color: "#15803d", marginTop: "4px", marginLeft: "24px" }}>
                Displayed date: {new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "24px",
            }}
          >
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? "⏳ Saving…" : editingItem ? "💾 Save Changes" : "➕ Publish Article"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              ✕ Cancel
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: LIVE CARD PREVIEW */}
      <div className="news-form-column-right">
        <h3
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#475569",
            fontSize: "15px",
            fontWeight: 700,
            borderBottom: "2px solid #edf2f7",
            paddingBottom: "8px",
          }}
        >
          👁️ Live Storefront Card Preview
        </h3>

        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "transparent" }}>
          <div
            style={{
              overflow: "hidden",
              borderRadius: "16px",
              marginBottom: "20px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
              height: "250px",
            }}
          >
            {previewImgUrl ? (
              <img
                src={previewImgUrl}
                alt="Article Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  backgroundColor: "#f8fafc",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                🖼️ No image selected
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", padding: "0 6px" }}>
            {includeDate && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#2563eb",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}

            <h2
              style={{
                fontSize: "21px",
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 10px 0",
                lineHeight: "1.3",
                wordBreak: "break-word",
              }}
            >
              {title || "Your Article Headline"}
            </h2>

            <p
              style={{
                fontSize: "15px",
                color: "#475569",
                lineHeight: "1.6",
                margin: "0 0 20px 0",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {content ||
                "Your article body text will appear here in real time as you type in the form on the left..."}
            </p>

            {buttonText && buttonUrl && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#2563eb",
                }}
              >
                {buttonText} <span style={{ marginLeft: "6px" }}>→</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsForm;