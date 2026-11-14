// src/components/PolicyView/PolicyView.tsx
import React, { useEffect, useState } from "react";
import pb from "../../api/pocketbase";
import "./PolicyView.css";

interface PolicyViewProps {
  type: "returns" | "delivery" | "terms" | "privacy";
}

const PolicyView: React.FC<PolicyViewProps> = ({ type }) => {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  let pageTitle = "";
  switch (type) {
    case "returns":
      pageTitle = "Return & Exchange Policy";
      break;
    case "delivery":
      pageTitle = "Shipping & Delivery Policy";
      break;
    case "terms":
      pageTitle = "Terms of Service";
      break;
    case "privacy":
      pageTitle = "Privacy & Cookie Policy";
      break;
  }

  useEffect(() => {
    document.title = `${pageTitle} | DemoShop`;
    setLoading(true);
    setDoc(null);
    setErrorMsg(null);

    const fetchPolicy = async () => {
      try {
        const records = await pb.collection("documents").getFullList({
          requestKey: null,
        });
        const matchedDoc = records.find((r) => r.type === type);
        setDoc(matchedDoc || null);
      } catch (error: any) {
        if (!error.isAbort) {
          setErrorMsg(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [type, pageTitle]);

  if (loading) {
    return (
      <div className="policy-client-container">
        <p>Loading document...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="policy-client-container">
        <h1 className="policy-client-title">{pageTitle}</h1>
        <p style={{ color: "#dc2626", fontWeight: "bold" }}>Database error:</p>
        <p>{errorMsg}</p>
      </div>
    );
  }

  if (!doc || !doc.file) {
    return (
      <div className="policy-client-container">
        <h1 className="policy-client-title">{pageTitle}</h1>
        <p className="policy-client-date" style={{ color: "#64748b" }}>
          This policy document has not been uploaded yet. For inquiries, contact support@example.com.
        </p>
      </div>
    );
  }

  let formattedDate = "Not specified";
  if (doc.updated_date) {
    const dateObj = new Date(doc.updated_date);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }

  const fileUrl = pb.files.getURL(doc, doc.file);

  return (
    <div className="policy-client-container">
      <h1 className="policy-client-title">{pageTitle}</h1>
      <p className="policy-client-date">Last updated: {formattedDate}</p>

      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="policy-client-btn">
        Open Official PDF Document
      </a>
    </div>
  );
};

export default PolicyView;