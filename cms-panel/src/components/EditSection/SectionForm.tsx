// src/components/EditSection/SectionForm.tsx
import React, { useState, useEffect, useRef } from "react";
import { pb } from "../../pocketbaseClient";
import { type Section } from "../../types/section";

type Props = {
  editingSection?: Section | null;
  onCancel: () => void;
  onSaved: () => void;
};

const SectionForm: React.FC<Props> = ({
  editingSection = null,
  onCancel,
  onSaved,
}) => {
  const [title, setTitle] = useState(editingSection?.title || "");
  const [subtitle, setSubtitle] = useState(editingSection?.subtitle || "");
  const [order, setOrder] = useState(editingSection?.order ?? 1);
  const [file, setFile] = useState<File | null>(null);
  const [buttonText, setButtonText] = useState(editingSection?.button_text || "");
  const [buttonUrl, setButtonUrl] = useState(editingSection?.button_url || "");
  const [saving, setSaving] = useState(false);

  const [previewImgUrl, setPreviewImgUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatNewlines = (text: string) => {
    if (!text) return "";
    return text.split(/\\n|\n/).map((line, i, arr) => (
      <React.Fragment key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  useEffect(() => {
    if (!editingSection) {
      (async () => {
        try {
          const records = await pb.collection("sections").getFullList<Section>({
            sort: "-order",
            requestKey: null,
          });
          const max = records && records.length > 0 ? records[0].order : 0;
          setOrder(max + 1);
        } catch (err) {
          console.error("Failed to fetch max section order:", err);
        }
      })();
    }
  }, [editingSection]);

  useEffect(() => {
    if (editingSection) {
      setTitle(editingSection.title);
      setSubtitle(editingSection.subtitle);
      setOrder(editingSection.order);
      setButtonText(editingSection.button_text || "");
      setButtonUrl(editingSection.button_url || "");
    }
  }, [editingSection]);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImgUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (editingSection && editingSection.image_path) {
      if (editingSection.image_path.startsWith("http")) {
        setPreviewImgUrl(editingSection.image_path);
      } else {
        setPreviewImgUrl(
          `${pb.baseUrl}/api/files/sections/${editingSection.id}/${editingSection.image_path}`
        );
      }
    } else {
      setPreviewImgUrl("");
    }
  }, [file, editingSection]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!editingSection && !file) {
        alert("Please select or drop a banner image for this section.");
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("subtitle", subtitle);
      formData.append("order", String(order));
      if (buttonText) formData.append("button_text", buttonText);
      if (buttonUrl) formData.append("button_url", buttonUrl);
      if (file) formData.append("image_path", file);

      if (editingSection?.id) {
        if (file) {
          await pb.collection("sections").update(String(editingSection.id), formData);
        } else {
          await pb.collection("sections").update(String(editingSection.id), {
            title,
            subtitle,
            order,
            button_text: buttonText,
            button_url: buttonUrl,
          });
        }
      } else {
        await pb.collection("sections").create(formData);
      }

      onSaved();
    } catch (err: any) {
      console.error("PocketBase error:", err);
      const msg = err?.message || "Unknown error";
      alert("Failed to save section: " + msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section-form-layout-container">
      <style>
        {`
        .section-form-layout-container {
          display: flex;
          gap: 40px;
          flex-direction: column;
          width: 100%;
        }
        .section-form-column-left {
          flex: 12;
          min-width: 0;
        }
        .section-form-column-right {
          flex: 11;
          min-width: 320px;
          position: sticky;
          top: 24px;
        }
        .section-dropzone {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 28px 20px;
          text-align: center;
          background-color: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .section-dropzone:hover, .section-dropzone.dragging {
          border-color: #2563eb;
          background-color: #eff6ff;
        }
        @media (min-width: 1024px) {
          .section-form-layout-container {
            flex-direction: row;
            align-items: flex-start;
          }
        }
        @media (max-width: 1023px) {
          .section-form-column-right {
            display: none;
          }
        }
        `}
      </style>

      <div className="section-form-column-left">
        <form onSubmit={handleSubmit}>
          <h2 style={{ marginTop: 0, marginBottom: "24px", color: "#0f172a" }}>
            {editingSection ? "✏️ Edit Homepage Section" : "➕ Create Homepage Section"}
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <label className="admin-label">Section Headline (Use \n for line break)*</label>
            <textarea
              className="admin-input"
              placeholder="e.g. Minimalist Essentials\nAutumn/Winter Collection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              required
            />
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
              <label className="admin-label">Subtitle / Description</label>
              <input
                className="admin-input"
                placeholder="e.g. Engineered from heavyweight organic fabrics."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
            <div>
              <label className="admin-label">Display Order (Position on page)</label>
              <input
                className="admin-input"
                type="number"
                value={order}
                onChange={(e) => setOrder(+e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label className="admin-label">CTA Button Label (Optional)</label>
              <input
                className="admin-input"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g. Shop Collection"
              />
            </div>
            <div>
              <label className="admin-label">CTA Button Link (Optional)</label>
              <input
                className="admin-input"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="e.g. /collections"
              />
            </div>
          </div>

          {/* DRAG & DROP BANNER UPLOAD */}
          <div style={{ marginBottom: "24px" }}>
            <label className="admin-label" style={{ marginBottom: "8px", display: "block" }}>
              Section Banner Image{" "}
              {editingSection && (
                <span style={{ color: "#64748b", fontWeight: "normal" }}>
                  (drop or select a file only if you want to replace the current image)
                </span>
              )}
            </label>

            <div
              className={`section-dropzone ${isDragging ? "dragging" : ""}`}
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
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🖼️</div>
              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "14px", marginBottom: "4px" }}>
                {file
                  ? `Selected: ${file.name}`
                  : "Drag & drop section banner here, or click to browse"}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                High-resolution JPG, PNG, or WEBP recommended
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
              display: "flex",
              gap: "12px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "24px",
            }}
          >
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? "⏳ Saving…" : editingSection ? "💾 Save Changes" : "➕ Add Section"}
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

      {/* RIGHT COLUMN: LIVE HOMEPAGE SECTION PREVIEW */}
      <div className="section-form-column-right">
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
          👁️ Live Homepage Section Preview
        </h3>

        <div
          style={{
            width: "100%",
            border: "none",
            backgroundColor: "transparent",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "4/3",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundImage: previewImgUrl ? `url(${previewImgUrl})` : "none",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              backgroundColor: previewImgUrl ? "transparent" : "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!previewImgUrl && (
              <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 700 }}>
                No banner image selected
              </span>
            )}
          </div>

          <div style={{ width: "100%", color: "#0f172a", padding: "0 8px" }}>
            <h1 style={{ fontSize: "2.1rem", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              {title ? formatNewlines(title) : "Section Headline"}
            </h1>
            {subtitle && (
              <p style={{ color: "#64748b", marginTop: "0.85rem", marginBottom: 0, fontSize: "1rem", lineHeight: 1.5 }}>
                {formatNewlines(subtitle)}
              </p>
            )}
            {buttonText && (
              <button
                type="button"
                style={{
                  marginTop: "1.25rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px 22px",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}
              >
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionForm;