import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import pb from "../api/pocketbase";

export default function SuccessPage() {
  const { dispatch } = useCart();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    document.title = "Order Confirmation | DemoShop";
    const orderId = sessionStorage.getItem("lastOrderId");
    if (!orderId) {
      navigate("/");
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    const checkPayment = async () => {
      try {
        const record = await pb.collection("orders").getOne(orderId);
        if (record.status === "paid" || record.status === "opłacone") {
          setStatus("success");
          sessionStorage.removeItem("lastOrderId");
          dispatch({ type: "CLEAR_CART" });
          return true;
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
      return false;
    };

    const interval = setInterval(async () => {
      attempts++;
      const isPaid = await checkPayment();
      if (isPaid) {
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStatus("error");
      }
    }, 2000);

    checkPayment().then((isPaid) => {
      if (isPaid) clearInterval(interval);
    });

    return () => clearInterval(interval);
  }, [navigate, dispatch]);

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <h2>Verifying your payment with the bank...</h2>
        <p style={{ color: "#64748b" }}>Please do not refresh this page. This usually takes a few seconds.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <h1 style={{ color: "#16a34a", fontSize: "2.2rem", marginBottom: "16px" }}>
          Thank You for Your Order!
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#334155", marginBottom: "24px" }}>
          Your payment has been confirmed. We are preparing your package for dispatch!
        </p>

        <div
          style={{
            backgroundColor: "#fef3c7",
            color: "#92400e",
            padding: "16px 20px",
            borderRadius: "12px",
            maxWidth: "560px",
            margin: "0 auto 30px auto",
            border: "1px solid #fde68a",
            fontSize: "0.95rem",
            lineHeight: "1.5",
          }}
        >
          <strong>Important Notice:</strong> We have sent an order confirmation to your email address (e.g., customer@example.com).
          <br />
          If you do not see it in your inbox within a few minutes, <b>please check your Spam or Promotions folder</b>.
        </div>

        <Link
          to="/"
          style={{
            padding: "12px 28px",
            backgroundColor: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "10px",
            fontWeight: 700,
            display: "inline-block",
          }}
        >
          Return to DemoShop
        </Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <h1 style={{ color: "#dc2626", fontSize: "2rem", marginBottom: "16px" }}>
        Payment Not Confirmed Yet
      </h1>
      <p style={{ fontSize: "1.1rem", color: "#475569", marginBottom: "28px" }}>
        Your payment was declined, canceled, or is still awaiting verification from your bank.
      </p>
      <Link
        to="/cart"
        style={{
          padding: "12px 28px",
          backgroundColor: "#dc2626",
          color: "white",
          textDecoration: "none",
          borderRadius: "10px",
          fontWeight: 700,
        }}
      >
        Return to Checkout
      </Link>
    </div>
  );
}