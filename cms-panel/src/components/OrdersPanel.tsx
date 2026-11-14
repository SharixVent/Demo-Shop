// src/components/OrdersPanel.tsx
import React, { useEffect, useState } from "react";
import { pb } from "../pocketbaseClient";
import { useNavigate } from "react-router-dom";
import "../AdminStyles.css";

interface OrderItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  imagePath?: string;
  hasPromo?: boolean;
  originalPrice?: number;
}

interface Order {
  id: string;
  email: string;
  status: string;
  total: number;
  created: string;
  tracking_website?: string;
  first_name: string;
  last_name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  clientType: string;
  companyName: string;
  nip: string;
  delivery_method: string;
  notes: string;
  items: OrderItem[];
}

// Keep compatibility with both backend hooks ("opłacone") and English statuses
const statuses = ["unpaid", "paid", "shipped", "nieopłacone", "opłacone", "wysłano"];

function mapOrder(r: any): Order {
  let parsedItems: OrderItem[] = [];
  if (Array.isArray(r.items)) {
    parsedItems = r.items;
  } else if (typeof r.items === "string" && r.items.trim() !== "") {
    try {
      parsedItems = JSON.parse(r.items);
    } catch (e) {
      console.error(e);
    }
  }

  return {
    id: r.id,
    email: r.email || "customer@example.com",
    status: r.status || "unpaid",
    total: Number(r.total) || 0,
    created: r.created,
    tracking_website: r.tracking_website,
    first_name: r.first_name || "",
    last_name: r.last_name || "",
    street: r.street || "",
    house_number: r.house_number || "",
    postal_code: r.postal_code || "",
    city: r.city || "",
    clientType: r.clientType || "private",
    companyName: r.companyName || "",
    nip: r.nip || "",
    delivery_method: r.delivery_method || "",
    notes: r.notes || "",
    items: parsedItems,
  };
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [editData, setEditData] = useState({ status: "", tracking_website: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchOrders = async () => {
    try {
      const list = await pb.collection("orders").getFullList({ requestKey: null });
      setOrders(list.map(mapOrder));
    } catch (err: any) {
      if (!err.isAbort) console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleEditClick = (o: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingId(o.id);
    setEditData({ status: o.status, tracking_website: o.tracking_website || "" });
  };

  const handleSaveClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      await pb.collection("orders").update(id, {
        status: editData.status,
        tracking_website: editData.tracking_website,
      });
      setUpdatingId(null);
      await fetchOrders();
    } catch {
      alert("Failed to update order status.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export Orders to CSV (WooCommerce feature)
  const handleExportCsv = () => {
    const headers = ["OrderID,Date,Status,Email,FirstName,LastName,City,Delivery,Total"];
    const rows = orders.map(
      (o) =>
        `${o.id},${o.created},${o.status},${o.email},"${o.first_name}","${o.last_name}","${o.city}","${o.delivery_method}",${o.total.toFixed(2)}`
    );
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demoshop-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getOrderTimeLegend = (dateString: string) => {
    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: "Today", color: "#16a34a" };
    if (diffDays === 1) return { text: "Yesterday", color: "#0284c7" };
    return { text: `${diffDays} days ago`, color: "#d97706" };
  };

  const isOrderPaid = (s: string) => s === "opłacone" || s === "paid";
  const isOrderShipped = (s: string) => s === "wysłano" || s === "shipped";
  const isOrderUnpaid = (s: string) =>
    s.toLowerCase().includes("nieopłacone") || s.toLowerCase().includes("unpaid");

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "paid") return matchesSearch && isOrderPaid(o.status);
    if (filterStatus === "shipped") return matchesSearch && isOrderShipped(o.status);
    if (filterStatus === "unpaid") return matchesSearch && isOrderUnpaid(o.status);
    return matchesSearch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const weight = (s: string) => (isOrderPaid(s) ? 1 : isOrderShipped(s) ? 2 : 3);
    if (weight(a.status) !== weight(b.status)) return weight(a.status) - weight(b.status);
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });

  return (
    <div className="admin-root">
      <div className="admin-header-container">
        <div>
          <button className="admin-btn admin-btn-back" onClick={() => navigate("/admin")} style={{ marginBottom: "16px" }}>
            ← Back to Dashboard
          </button>
          <h1 className="admin-title">📦 Order Fulfillment & Tracking</h1>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={handleExportCsv}>
          📥 Export Orders to CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="admin-card" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px" }}>
          <label className="admin-label">Search Order</label>
          <input
            type="search"
            className="admin-input"
            placeholder="Order ID, customer name, or customer@example.com..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label className="admin-label">Filter by Status</label>
          <select
            className="admin-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders ({orders.length})</option>
            <option value="paid">Paid (Ready to Pack)</option>
            <option value="shipped">Shipped</option>
            <option value="unpaid">Unpaid / Pending</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {sortedOrders.map((o) => {
          const unpaid = isOrderUnpaid(o.status);
          const timeLegend = getOrderTimeLegend(o.created);
          const isExpanded = !!expandedIds[o.id];
          const isLocker =
            o.delivery_method.toLowerCase().includes("paczkomat") ||
            o.delivery_method.toLowerCase().includes("locker");

          let statusColor = "#475569";
          let statusBg = "#f1f5f9";
          if (isOrderPaid(o.status)) {
            statusColor = "#15803d";
            statusBg = "#dcfce7";
          } else if (isOrderShipped(o.status)) {
            statusColor = "#0369a1";
            statusBg = "#e0f2fe";
          }

          return (
            <div
              key={o.id}
              style={{
                backgroundColor: "white",
                border: `1px solid ${statusColor}40`,
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
                opacity: unpaid && !isExpanded ? 0.65 : 1,
              }}
            >
              <div
                onClick={() => toggleExpand(o.id)}
                style={{
                  backgroundColor: statusBg,
                  padding: "16px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span>{isExpanded ? "▼" : "▶"}</span>
                  <h3 style={{ margin: 0, color: statusColor, fontSize: "1.15rem" }}>
                    #{o.id.slice(0, 8)}
                  </h3>

                  {updatingId === o.id ? (
                    <select
                      className="admin-input"
                      style={{ width: "auto" }}
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      style={{
                        backgroundColor: "white",
                        color: statusColor,
                        padding: "4px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {o.status}
                    </span>
                  )}

                  {!unpaid && (
                    <span
                      style={{
                        backgroundColor: "rgba(255,255,255,0.8)",
                        color: timeLegend.color,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      ⏱ {timeLegend.text}
                    </span>
                  )}

                  <span style={{ fontSize: "13px", color: "#475569", fontWeight: 600 }}>
                    ({o.items.length} item(s) to pack)
                  </span>
                </div>

                <div
                  style={{ display: "flex", gap: "14px", alignItems: "center" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                    ${o.total.toFixed(2)}
                  </div>

                  {updatingId === o.id ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={(e) => handleSaveClick(o.id, e)}
                        disabled={isSaving}
                      >
                        Save
                      </button>
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => setUpdatingId(null)}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="admin-btn admin-btn-secondary"
                      onClick={(e) => handleEditClick(o, e)}
                      style={{ background: "#fff" }}
                    >
                      Edit Status / Tracking
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "18px",
                  padding: "20px 24px",
                }}
              >
                <div className="admin-card-inner" style={{ margin: 0 }}>
                  <div className="admin-kpi-label" style={{ marginBottom: "6px" }}>
                    Recipient & Shipping Address
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>
                    {o.first_name} {o.last_name}
                  </div>
                  <div style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    {o.street} {o.house_number}
                    <br />
                    {o.postal_code} {o.city}
                    <br />
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>✉️ {o.email}</span>
                  </div>
                  {(o.clientType === "firma" || o.clientType === "company") && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "8px",
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <strong>Company VAT Invoice:</strong> {o.companyName} (Tax ID: {o.nip})
                    </div>
                  )}
                </div>

                <div className="admin-card-inner" style={{ margin: 0 }}>
                  <div className="admin-kpi-label" style={{ marginBottom: "6px" }}>
                    Delivery & Tracking
                  </div>
                  <div
                    style={{
                      background: isLocker ? "#fef08a" : "#e0e7ff",
                      color: isLocker ? "#a16207" : "#4f46e5",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      display: "inline-block",
                      fontSize: "0.88rem",
                    }}
                  >
                    {o.delivery_method || "Standard Courier"}
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                      Shipment Tracking URL:
                    </div>
                    {updatingId === o.id ? (
                      <input
                        type="url"
                        className="admin-input"
                        placeholder="https://tracking.example.com/..."
                        value={editData.tracking_website}
                        onChange={(e) =>
                          setEditData({ ...editData, tracking_website: e.target.value })
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : o.tracking_website ? (
                      <a
                        href={o.tracking_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.9rem" }}
                      >
                        Open Tracking Link ↗
                      </a>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                        No tracking link added yet
                      </span>
                    )}
                  </div>

                  {o.notes && (
                    <div style={{ marginTop: "10px", color: "#92400e", fontSize: "0.85rem" }}>
                      <strong>Customer Note:</strong> "{o.notes}"
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: "0 24px 20px", borderTop: "1px dashed #cbd5e1" }}>
                  <h4 style={{ margin: "16px 0 10px", fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b" }}>
                    Packing List:
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {o.items.map((item, idx) => (
                      <div
                        key={item.id + idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {item.imagePath && (
                            <img
                              src={item.imagePath}
                              alt={item.name}
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 700 }}>{item.name}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>ID: {item.id}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>SIZE</span>
                            <strong style={{ color: "#dc2626" }}>{item.size}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>QTY</span>
                            <strong>{item.quantity}x</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>SUBTOTAL</span>
                            <strong>${((Number(item.price) || 0) * item.quantity).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}