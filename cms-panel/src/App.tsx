import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "./AdminPanel";
import EditNews from "./components/EditNews/EditNews";
import EditNewsLoader from "./components/EditNews/EditNewsLoader";
import EditSections from "./components/EditSection/EditSections"; 
import EditSectionLoader from "./components/EditSection/EditSectionLoader";
import EditCategories from "./components/EditCategory/EditCategories";
import Login from "./components/Login/Login";
import { useAuth } from "./context/AuthContext";
import OrdersPanel from "./components/OrdersPanel";
import EditPromotions from "./components/EditPromotions/EditPromotions";
import { PoliciesPage } from "./components/Policies/PoliciesPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user } = useAuth();
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => (
    <Routes>
        <Route path="/login" element={<Login />} />

        {/* DODANO: Główna ścieżka aplikacji admina ładująca panel */}
        <Route
            path="/"
            element={
                <ProtectedRoute>
                    <AdminPanel />
                </ProtectedRoute>
            }
        />

        <Route
            path="/admin"
            element={
                <ProtectedRoute>
                    <AdminPanel />
                </ProtectedRoute>
            }
        />
        
        <Route
            path="/admin/orders"
            element={
                <ProtectedRoute>
                    <OrdersPanel />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/news"
            element={
                <ProtectedRoute>
                    <EditNews />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/news/edit/:id"
            element={
                <ProtectedRoute>
                    <EditNewsLoader
                        onSaved={() => {
                            /* refresh if needed */
                        }}
                    />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/sections"
            element={
                <ProtectedRoute>
                    <EditSections />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/categories"
            element={
                <ProtectedRoute>
                    <EditCategories />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/sections/edit/:id"
            element={
                <ProtectedRoute>
                    <EditSectionLoader />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/promotions"
            element={
                <ProtectedRoute>
                    <EditPromotions />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/policies"
            element={
                <ProtectedRoute>
                    <PoliciesPage />
                </ProtectedRoute>
            }
        />

        <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
);

export default App;