// src/components/Login/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login: React.FC = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      setError("Invalid administrator email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9", fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 15px 35px rgba(15,23,42,0.08)", border: "1px solid #e2e8f0" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: "24px", fontWeight: 800 }}>Administrator Sign In</h2>
          <p style={{ color: "#2563eb", margin: "6px 0 0 0", fontSize: "14px", fontWeight: 700 }}>DemoShop CMS</p>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px", border: "1px solid #fecaca", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>Admin Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ width: "100%", padding: "14px", marginTop: "6px" }}>
            {loading ? "Signing in..." : "Sign In to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;