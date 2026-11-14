// src/components/CartPage/CartPage.tsx
import React, { useEffect, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import "./CartPage.css";
import { createOrder, getStoreSettings, StoreSettings } from "../../api/api";
import pb from "../../api/pocketbase";

function makeImageUrl(path?: string): string {
  if (!path) return "/placeholder.png";
  return path;
}

type CartProduct = {
  id: string;
  name: string;
  price: number;
  size: string;
  imagePath: string;
  originalPrice?: number;
};

export const CartPage: React.FC = () => {
  const { state, dispatch } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [sending, setSending] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState<"courier" | "parcel_locker">("courier");
  const [parcel_lockerCode, setparcel_lockerCode] = useState("");

  const [formData, setFormData] = useState({
    clientType: "private", // "private" | "company"
    companyName: "",
    nip: "",
    firstName: "",
    lastName: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    email: "",
    notes: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signedMap, setSignedMap] = useState<Record<string, string>>({});

  const [deliverySettings, setDeliverySettings] = useState<StoreSettings>({
    courier: 15.0,
    parcel_locker: 14.0,
    freeThreshold: 249.0,
  });

  useEffect(() => {
    document.title = "Shopping Cart & Checkout | DemoShop";

    const syncCartPrices = async () => {
      if (state.items.length === 0) return;
      try {
        const ids = [...new Set(state.items.map((i) => i.product.id))];
        const filterStr = ids.map((id) => `id="${id}"`).join(" || ");

        const records = await pb.collection("items").getFullList({
          filter: filterStr,
          requestKey: null,
        });

        const liveData = records.map((record) => {
          const originalPrice = record.price || 0;
          let realPrice = originalPrice;
          const salePrice = record.sale_price || 0;
          const saleEndDateStr = record.sale_end_date || "";

          if (salePrice > 0) {
            if (!saleEndDateStr) {
              realPrice = salePrice;
            } else {
              const endDate = new Date(saleEndDateStr);
              endDate.setHours(23, 59, 59, 999);
              if (endDate.getTime() >= Date.now()) {
                realPrice = salePrice;
              }
            }
          }
          return { id: record.id, price: realPrice, originalPrice };
        });

        dispatch({ type: "SYNC_PRICES", updatedProducts: liveData });
      } catch (err) {
        console.error("Price sync error:", err);
      }
    };

    syncCartPrices();
    getStoreSettings().then((settings) => {
      setDeliverySettings(settings);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    state.items.forEach((item) => {
      const p = item.product as unknown as CartProduct;
      const key = `${p.id}_${p.size}`;
      setSignedMap((m) => ({ ...m, [key]: makeImageUrl(p.imagePath) }));
    });
  }, [state.items]);

  const openparcel_lockerMap = () => {
    const ep = (window as any).easyPack;
    if (ep) {
      ep.init({});
      ep.modalMap(
        (point: any, modal: any) => {
          setparcel_lockerCode(point.name);
          modal.closeModal();
        },
        { width: 600, height: 600 }
      );
    } else {
      alert("Parcel Locker map is still loading. Please refresh or enter the locker code manually.");
    }
  };

  const itemsTotal = state.items.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0
  );

  const isFreeDelivery = itemsTotal >= deliverySettings.freeThreshold;
  const deliveryCost = isFreeDelivery
    ? 0
    : deliveryMethod === "courier"
    ? deliverySettings.courier
    : deliverySettings.parcel_locker;
  const finalTotal = itemsTotal + deliveryCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.items.length === 0) return alert("Your cart is empty.");
    if (deliveryMethod === "parcel_locker" && !parcel_lockerCode)
      return alert("Please select a Parcel Locker point.");
    if (!acceptTerms) return alert("Please accept the Terms of Service to place your order.");

    setSending(true);
    const itemsPayload = state.items.map(({ product, quantity }) => {
      const p = product as unknown as CartProduct;
      return {
        id: p.id,
        name: p.name,
        size: p.size,
        quantity,
        price: p.price,
        imagePath: p.imagePath,
      };
    });

    try {
      const orderDataToSave = {
        ...formData,
        delivery_method:
          deliveryMethod === "parcel_locker" ? `Parcel Locker: ${parcel_lockerCode}` : "Courier",
        delivery_cost: deliveryCost,
      };

      const orderRecord = await createOrder(formData.email, itemsPayload, orderDataToSave);

      const baseApiUrl = (import.meta.env.VITE_POCKETBASE_URL || "").replace(/\/$/, "");
      const p24Response = await fetch(`${baseApiUrl}/api/p24/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderRecord.id,
          amount: Math.round(finalTotal * 100),
          email: formData.email,
        }),
      });

      const p24Data = await p24Response.json();

      if (p24Data.status === "success" && p24Data.url) {
        sessionStorage.setItem("lastOrderId", orderRecord.id);
        window.location.href = p24Data.url;
        return;
      } else {
        alert("Payment gateway error: " + (p24Data.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Order submit error:", err);
      alert(err?.message || "An error occurred while submitting your order.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="cartpage-root">
      <h1 className="cartpage-title">
        {step === "cart" ? "Your Shopping Cart" : "Shipping & Payment Details"}
      </h1>

      {state.items.length === 0 ? (
        <div className="cartpage-empty">
          <p style={{ fontSize: "1.15rem", color: "#64748b", marginBottom: "20px" }}>
            Your shopping cart is currently empty.
          </p>
          <button className="cartpage-pay-btn" onClick={() => navigate("/collections")}>
            Browse Collections
          </button>
        </div>
      ) : (
        <>
          {step === "cart" && (
            <div className="cartpage-view">
              <div className="cartpage-list">
                {state.items.map((item) => {
                  const p = item.product as unknown as CartProduct;
                  const size = p.size;
                  const key = `${p.id}_${size}`;
                  const imgUrl = signedMap[key] || "/placeholder.png";
                  const isPromoActive = p.originalPrice && p.originalPrice > p.price;

                  return (
                    <div className="cartpage-item" key={key}>
                      <img className="cartpage-photo" src={imgUrl} alt={p.name} />
                      <div className="cartpage-info">
                        <div className="cartpage-name">
                          <Link to={`/item/${p.id}`} className="cartpage-link">
                            {p.name}
                          </Link>
                        </div>
                        <div className="cartpage-row">
                          Size: <b>{size}</b>
                        </div>
                        <div
                          className="cartpage-row"
                          style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                          Total:{" "}
                          {isPromoActive ? (
                            <>
                              <span className="cartpage-price-old">
                                ${(p.originalPrice! * item.quantity).toFixed(2)}
                              </span>
                              <span className="cartpage-price-new">
                                ${(p.price * item.quantity).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <b style={{ fontSize: "1.1rem" }}>
                              ${(p.price * item.quantity).toFixed(2)}
                            </b>
                          )}
                        </div>
                        <div className="cartpage-quantity-controls">
                          <button
                            className="cartpage-qty-btn"
                            onClick={() => dispatch({ type: "ADD_TO_CART", product: item.product })}
                          >
                            +
                          </button>
                          <span className="cartpage-qty">{item.quantity}</span>
                          <button
                            className="cartpage-qty-btn"
                            onClick={() =>
                              dispatch({ type: "REMOVE_ONE_FROM_CART", productId: p.id, size })
                            }
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <button
                            className="cartpage-remove-btn"
                            onClick={() =>
                              dispatch({ type: "REMOVE_ALL_FROM_CART", productId: p.id, size })
                            }
                            title="Remove item"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cartpage-summary">
                <div>
                  <div className="cartpage-total-label">Subtotal</div>
                  <div className="cartpage-total-value">${itemsTotal.toFixed(2)}</div>
                </div>
                <button className="cartpage-pay-btn" onClick={() => setStep("checkout")}>
                  Proceed to Checkout →
                </button>
                <div>
                  <button className="cartpage-back-btn" onClick={() => navigate("/collections")}>
                    ← Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "checkout" && (
            <div className="cartpage-checkout-view">
              <form className="cartpage-form" onSubmit={handleOrder}>
                <h3 style={{ marginTop: 0, fontSize: "18px", color: "#0f172a", marginBottom: "15px" }}>
                  Delivery Method
                </h3>

                {isFreeDelivery ? (
                  <div
                    style={{
                      color: "#166534",
                      backgroundColor: "#dcfce3",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 700,
                      marginBottom: "15px",
                    }}
                  >
                    ✓ You qualify for Free Shipping!
                  </div>
                ) : (
                  <div
                    style={{
                      color: "#92400e",
                      backgroundColor: "#fef3c7",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "15px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    Free shipping on orders over ${deliverySettings.freeThreshold.toFixed(2)} (add $
                    {(deliverySettings.freeThreshold - itemsTotal).toFixed(2)} more)
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                    marginBottom: "25px",
                  }}
                >
                  <div
                    onClick={() => setDeliveryMethod("courier")}
                    style={{
                      border:
                        deliveryMethod === "courier" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      backgroundColor: deliveryMethod === "courier" ? "#eff6ff" : "#ffffff",
                      padding: "20px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "16px" }}>
                      Express Courier
                    </div>
                    <div
                      style={{
                        color: isFreeDelivery ? "#166534" : "#64748b",
                        marginTop: "4px",
                        fontWeight: 700,
                      }}
                    >
                      {isFreeDelivery ? "$0.00" : `$${deliverySettings.courier.toFixed(2)}`}
                    </div>
                  </div>

                  <div
                    onClick={() => setDeliveryMethod("parcel_locker")}
                    style={{
                      border:
                        deliveryMethod === "parcel_locker" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      backgroundColor: deliveryMethod === "parcel_locker" ? "#eff6ff" : "#ffffff",
                      padding: "20px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "16px" }}>
                      24/7 Parcel Locker
                    </div>
                    <div
                      style={{
                        color: isFreeDelivery ? "#166534" : "#64748b",
                        marginTop: "4px",
                        fontWeight: 700,
                      }}
                    >
                      {isFreeDelivery ? "$0.00" : `$${deliverySettings.parcel_locker.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                {deliveryMethod === "parcel_locker" && (
                  <div
                    style={{
                      marginBottom: "25px",
                      padding: "20px",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "12px",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "12px", color: "#334155" }}>
                      Select Your Parcel Locker
                    </div>
                    {parcel_lockerCode ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: "#fff",
                          padding: "12px 16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>Selected Locker:</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                            {parcel_lockerCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={openparcel_lockerMap}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openparcel_lockerMap}
                        style={{
                          width: "100%",
                          padding: "14px",
                          backgroundColor: "#facc15",
                          color: "#1e293b",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "15px",
                          cursor: "pointer",
                        }}
                      >
                        Select Locker on Map
                      </button>
                    )}
                  </div>
                )}

                <h3
                  style={{
                    marginTop: 0,
                    fontSize: "18px",
                    color: "#0f172a",
                    marginBottom: "15px",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "20px",
                  }}
                >
                  Customer & Billing Information
                </h3>

                <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "normal" }}>
                    <input
                      type="radio"
                      name="clientType"
                      value="private"
                      checked={formData.clientType === "private"}
                      onChange={handleChange}
                    />
                    Individual Customer
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "normal" }}>
                    <input
                      type="radio"
                      name="clientType"
                      value="company"
                      checked={formData.clientType === "company"}
                      onChange={handleChange}
                    />
                    Company (VAT Invoice)
                  </label>
                </div>

                {formData.clientType === "company" && (
                  <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    <label style={{ flex: "1 1 calc(50% - 15px)" }}>
                      Company Name:*
                      <input type="text" name="companyName" placeholder="DemoCorp LLC" value={formData.companyName} onChange={handleChange} required />
                    </label>
                    <label style={{ flex: "1 1 calc(50% - 15px)" }}>
                      Tax ID / VAT Number:*
                      <input type="text" name="nip" placeholder="0000000000" value={formData.nip} onChange={handleChange} required />
                    </label>
                  </div>
                )}

                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                  <label style={{ flex: "1 1 calc(50% - 15px)" }}>
                    First Name:*
                    <input type="text" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required />
                  </label>
                  <label style={{ flex: "1 1 calc(50% - 15px)" }}>
                    Last Name:*
                    <input type="text" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
                  </label>
                </div>

                <label>
                  Street Address:*
                  <input type="text" name="street" placeholder="123 Commerce St" value={formData.street} onChange={handleChange} required />
                </label>

                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                  <label style={{ flex: "1 1 calc(50% - 15px)" }}>
                    Building / Apt No.:*
                    <input type="text" name="houseNumber" placeholder="10A" value={formData.houseNumber} onChange={handleChange} required />
                  </label>
                  <label style={{ flex: "1 1 calc(50% - 15px)" }}>
                    Postal Code:*
                    <input type="text" name="postalCode" placeholder="00-001" value={formData.postalCode} onChange={handleChange} required />
                  </label>
                </div>

                <label>
                  City:*
                  <input type="text" name="city" placeholder="New York" value={formData.city} onChange={handleChange} required />
                </label>

                <label>
                  Email Address:*
                  <input type="email" name="email" placeholder="customer@example.com" value={formData.email} onChange={handleChange} required />
                </label>

                <label>
                  Order Notes (Optional):
                  <textarea
                    name="notes"
                    placeholder="Delivery instructions for the courier..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      resize: "vertical",
                      marginTop: "5px",
                    }}
                  />
                </label>

                <div
                  className="cartpage-summary"
                  style={{ marginTop: "30px", borderTop: "2px solid #e2e8f0", paddingTop: "20px" }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "14px",
                      color: "#334155",
                      marginBottom: "20px",
                      cursor: "pointer",
                      fontWeight: "normal",
                      textAlign: "left",
                      backgroundColor: "#f8fafc",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                      style={{ marginTop: "3px" }}
                    />
                    <span>
                      I have read and accept the{" "}
                      <Link to="/terms" target="_blank" style={{ color: "#2563eb", fontWeight: 700 }}>
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy-policy" target="_blank" style={{ color: "#2563eb", fontWeight: 700 }}>
                        Privacy Policy
                      </Link>
                      .*
                    </span>
                  </label>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                    <span>Items Subtotal:</span>
                    <span>${itemsTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                    <span>Shipping ({deliveryMethod === "courier" ? "Courier" : "Parcel Locker"}):</span>
                    <span>${deliveryCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div className="cartpage-total-label" style={{ margin: 0, fontSize: "1.4rem" }}>
                      Total Due
                    </div>
                    <div className="cartpage-total-value" style={{ color: "#2563eb", fontSize: "1.8rem", margin: 0 }}>
                      ${finalTotal.toFixed(2)}
                    </div>
                  </div>

                  <button type="submit" className="cartpage-pay-btn" disabled={sending} style={{ marginTop: "24px", width: "100%" }}>
                    {sending ? "Processing Order..." : "Order & Pay Now"}
                  </button>
                  <button type="button" className="cartpage-back-btn" onClick={() => setStep("cart")}>
                    ← Back to Cart
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CartPage;