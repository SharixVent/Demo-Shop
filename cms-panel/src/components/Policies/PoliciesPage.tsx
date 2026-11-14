// src/components/Policies/PoliciesPage.tsx
import React, { useState, useEffect } from "react";
import { pb } from "../../pocketbaseClient";
import { useNavigate } from "react-router-dom";
import "../../AdminStyles.css";
import "./Policies.css";

export const PoliciesPage = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDocs = async () => {
    try {
      const records = await pb.collection("documents").getFullList({ requestKey: null });
      setDocs(records);
    } catch (e: any) {
      if (!e?.isAbort) {
        console.error("Error fetching legal documents:", e);
      }
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (policyType: string, file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a valid PDF document (.pdf).");
      return;
    }

    const formData = new FormData();
    formData.append("type", policyType);
    formData.append("file", file);
    formData.append("updated_date", new Date().toISOString());

    const existing = docs.find((d) => d.type === policyType);

    try {
      if (existing) {
        await pb.collection("documents").update(existing.id, formData);
      } else {
        await pb.collection("documents").create(formData);
      }
      alert("PDF document uploaded successfully!");
      fetchDocs();
    } catch (err: any) {
      alert("Upload error: " + err.message);
    }
  };

  const handleDelete = async (docRecord: any, label: string) => {
    if (!confirm(`Are you sure you want to remove the PDF for "${label}"?`)) return;

    try {
      await pb.collection("documents").delete(docRecord.id);
      setDocs((prev) => prev.filter((d) => d.id !== docRecord.id));
    } catch (err: any) {
      alert("Failed to delete PDF document: " + (err?.message || "Unknown error"));
    }
  };

  const policyLabels: Record<string, string> = {
    returns: "🔄 Return & Exchange Policy",
    delivery: "🚚 Shipping & Delivery Policy",
    terms: "📜 Terms of Service",
    privacy: "🔒 Privacy & Cookie Policy",
  };

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
          <h1 className="admin-title">⚖️ Legal Documents Manager (PDF)</h1>
        </div>
      </div>

      <div className="policies-grid">
        {["returns", "delivery", "terms", "privacy"].map((policyType) => {
          const doc = docs.find((d) => d.type === policyType);

          let formattedDate = "Not uploaded";
          if (doc && doc.updated_date) {
            const dateObj = new Date(doc.updated_date);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          }

          const fileUrl = doc && doc.file ? pb.files.getURL(doc, doc.file) : null;

          return (
            <div key={policyType} className="admin-card policy-card">
              <div>
                <h3 style={{ color: "#0f172a", marginTop: 0 }}>{policyLabels[policyType]}</h3>

                <div className="policy-status">
                  {doc ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <span className="status-active">✓ Active (Updated: {formattedDate})</span>
                      </div>
                      {fileUrl && (
                        <div className="policy-current-file-bar">
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <strong>Current PDF:</strong>{" "}
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#2563eb", fontWeight: 700 }}
                            >
                              {doc.file} ↗
                            </a>
                          </div>
                          <button
                            type="button"
                            className="policy-delete-btn"
                            onClick={() => handleDelete(doc, policyLabels[policyType])}
                            title="Delete PDF document"
                          >
                            🗑️ Remove PDF
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="status-missing">✕ No PDF uploaded</span>
                  )}
                </div>
              </div>

              <div
                className={`policy-upload-wrapper ${draggingType === policyType ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingType(policyType);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingType(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingType(null);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleUpload(policyType, e.dataTransfer.files[0]);
                  }
                }}
              >
                <label className="admin-label" style={{ display: "block", marginBottom: "4px" }}>
                  {doc ? "Drag & Drop New PDF to Replace" : "Drag & Drop PDF File Here"}
                </label>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>
                  or select a file from your computer
                </span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="policy-upload-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUpload(policyType, e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoliciesPage;