import React, { useState, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Loader from "./components/Loader/Loader";
import Navbar from "./components/Navbar/Navigation";
import Footer from "./components/Footer/Footer";

const HomePage = React.lazy(() => import("./components/HomePage/HomePage"));
const Catalog = React.lazy(() => import("./components/Catalog/Catalog"));
const ItemPageLoader = React.lazy(() => import("./components/Item/ItemPageLoader"));
const CartPage = React.lazy(() => import("./components/CartPage/CartPage"));
const NewsPreview = React.lazy(() => import("./components/NewsPreview/NewsPreview"));
const PolicyView = React.lazy(() => import("./components/PolicyView/PolicyView"));
const SuccessPage = React.lazy(() => import("./components/SuccessPage"));

const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="main-container">
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <main className="page-content">
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* English SEO Routes + Legacy Polish Route Aliases */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/koszyk" element={<CartPage />} />

            <Route path="/collections" element={<Catalog />} />
            <Route path="/kolekcje" element={<Catalog />} />

            <Route path="/news" element={<NewsPreview />} />
            <Route path="/nowosci" element={<NewsPreview />} />

            <Route path="/item/:id" element={<ItemPageLoader />} />

            <Route path="/returns" element={<PolicyView type="returns" />} />
            <Route path="/zwroty" element={<PolicyView type="returns" />} />

            <Route path="/shipping" element={<PolicyView type="delivery" />} />
            <Route path="/dostawa" element={<PolicyView type="delivery" />} />

            <Route path="/terms" element={<PolicyView type="terms" />} />
            <Route path="/regulamin" element={<PolicyView type="terms" />} />

            <Route path="/privacy-policy" element={<PolicyView type="privacy" />} />
            <Route path="/polityka-prywatnosci" element={<PolicyView type="privacy" />} />

            <Route path="/cart/success" element={<SuccessPage />} />
            <Route path="/koszyk/sukces" element={<SuccessPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default App;