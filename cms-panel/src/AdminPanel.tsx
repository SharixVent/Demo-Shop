// src/AdminPanel.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ItemForm from "./components/EditItem/ItemForm";
import ItemList from "./components/EditItem/ItemList";
import type { Item } from "./types/item";
import { useAuth } from "./context/AuthContext";
import { pb } from "./pocketbaseClient";
import "./AdminStyles.css";

const AdminPanel: React.FC = () => {
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalProducts: 0,
    activePromos: 0,
    paidOrders: 0,
    totalRevenue: 0,
  });

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "DemoShop CMS — Store Administration";
    const loadStats = async () => {
      try {
        const [itemsRes, ordersRes] = await Promise.allSettled([
          pb.collection("items").getFullList<Item>({ requestKey: null }),
          pb.collection("orders").getFullList<any>({ requestKey: null }),
        ]);

        let totalProducts = 0;
        let activePromos = 0;
        if (itemsRes.status === "fulfilled") {
          totalProducts = itemsRes.value.length;
          activePromos = itemsRes.value.filter(
            (i) => i.sale_price && i.sale_price > 0
          ).length;
        }

        let paidOrders = 0;
        let totalRevenue = 0;
        if (ordersRes.status === "fulfilled") {
          const paid = ordersRes.value.filter((o) => {
            const s = (o.status || "").toLowerCase();
            return s === "opłacone" || s === "paid" || s === "wysłano" || s === "shipped";
          });
          paidOrders = paid.length;
          totalRevenue = paid.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        }

        setStats({ totalProducts, activePromos, paidOrders, totalRevenue });
      } catch (err) {
        console.error("Stats load error:", err);
      }
    };
    loadStats();
  }, [refreshKey]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleSaved = () => {
    setEditingItem(null);
    setRefreshKey((k) => k + 1);
  };

  // WordPress-like SEO Sitemap.xml Generator
  const handleDownloadSitemap = async () => {
    try {
      const items = await pb.collection("items").getFullList<Item>({ requestKey: null });
      const baseUrl = "https://example.com";
      const nowIso = new Date().toISOString();

      const staticUrls = ["/", "/collections", "/news", "/terms", "/privacy-policy", "/shipping", "/returns"];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      staticUrls.forEach((path) => {
        xml += `  <url>\n    <loc>${baseUrl}${path}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });

      items.forEach((item) => {
        xml += `  <url>\n    <loc>${baseUrl}/item/${item.id}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      });

      xml += `</urlset>`;

      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sitemap.xml";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to generate sitemap: " + err.message);
    }
  };

  return (
    <div className="admin-root">
      <div className="admin-header-container">
        <div>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2563eb", letterSpacing: "0.06em" }}>
            DEMOSHOP E-COMMERCE CMS
          </span>
          <h1 className="admin-title">Store Management Dashboard</h1>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleDownloadSitemap}
            title="Generate XML Sitemap for Google Search Console"
          >
            🌐 Export SEO Sitemap.xml
          </button>
          {user && (
            <button className="admin-btn admin-btn-danger" onClick={handleLogout}>
              Sign Out ({user.email})
            </button>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="admin-nav">
        <button className="admin-btn admin-btn-primary" onClick={() => navigate("/admin/orders")}>
          📦 Orders ({stats.paidOrders} Paid)
        </button>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate("/admin/categories")}>
          🗂️ Product Categories
        </button>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate("/admin/promotions")}>
          🔥 Promotions & Flash Sales
        </button>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate("/admin/news")}>
          📰 News & Lookbook
        </button>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate("/admin/sections")}>
          🖼️ Homepage Sections
        </button>
        <button className="admin-btn admin-btn-secondary" onClick={() => navigate("/admin/policies")}>
          ⚖️ Legal Documents (PDF)
        </button>
      </div>

      {/* WordPress / WooCommerce Style KPI Overview */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Catalog Products</span>
          <span className="admin-kpi-value">{stats.totalProducts}</span>
          <span className="admin-kpi-sub">Indexed for Google SEO</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Active On-Sale Items</span>
          <span className="admin-kpi-value" style={{ color: "#dc2626" }}>
            {stats.activePromos}
          </span>
          <span className="admin-kpi-sub">Promotional campaigns</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Completed Orders</span>
          <span className="admin-kpi-value" style={{ color: "#16a34a" }}>
            {stats.paidOrders}
          </span>
          <span className="admin-kpi-sub">Verified payments</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Gross Revenue</span>
          <span className="admin-kpi-value" style={{ color: "#2563eb" }}>
            ${stats.totalRevenue.toFixed(2)}
          </span>
          <span className="admin-kpi-sub">From paid & shipped orders</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "28px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Left Column: Product Editor + Yoast SEO Assistant */}
        <div className="admin-card" style={{ flex: "1 1 420px", margin: 0 }}>
          <ItemForm
            key={editingItem?.id ?? "new"}
            editingItem={editingItem}
            onSaved={handleSaved}
          />
        </div>

        {/* Right Column: Visual Product Cards / Inventory Manager */}
        <div className="admin-card" style={{ flex: "2 1 620px", margin: 0 }}>
          <div
            style={{
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "16px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#0f172a" }}>
                Product Inventory
              </h2>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Click any product to edit details, clone, or adjust pricing
              </span>
            </div>
            <input
              type="search"
              placeholder="Search by title, category, or subcategory..."
              className="admin-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "320px" }}
            />
          </div>

          <ItemList
            onEdit={(item) => {
              setEditingItem(item);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            refreshKey={refreshKey}
            searchTerm={searchTerm}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;