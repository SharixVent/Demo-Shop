// src/components/Navbar/Navigation.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import pb from "../../api/pocketbase";
import { getStoreSettings } from "../../api/api";
import "./Navigation.css";

type SearchItem = {
  id: string;
  name: string;
  category?: string;
  signedThumb: string;
  price: number;
  salePrice?: number;
};

interface NavbarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useCart();
  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [freeThreshold, setFreeThreshold] = useState<number>(249.0);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setSearchTerm("");
  }, [location.pathname, setMobileMenuOpen]);

  useEffect(() => {
    let mounted = true;
    getStoreSettings().then((settings) => {
      if (mounted) {
        setFreeThreshold(settings.freeThreshold);
      }
    });
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const safeTerm = searchTerm.trim().replace(/"/g, '\\"');
        const response = await pb.collection("items").getList(1, 6, {
          filter: `name ~ "${safeTerm}" || category ~ "${safeTerm}" || subcategory ~ "${safeTerm}"`,
          requestKey: "navbar_search",
        });

        const data: SearchItem[] = response.items.map((record: any) => {
          let thumb = "https://placehold.co/100x100/f1f5f9/475569?text=DemoShop";
          const images = record.images;
          let firstImage: string | null = null;

          if (Array.isArray(images) && images.length > 0) {
            firstImage = images[0];
          } else if (typeof images === "string" && images !== "") {
            firstImage = images;
          }

          if (firstImage) {
            thumb = firstImage.startsWith("http")
              ? firstImage
              : pb.files.getURL(record, firstImage, { thumb: "100x100" });
          }

          let activeSalePrice: number | undefined = undefined;
          if (record.sale_price && record.sale_price > 0) {
            if (!record.sale_end_date) {
              activeSalePrice = record.sale_price;
            } else {
              const end = new Date(record.sale_end_date);
              end.setHours(23, 59, 59, 999);
              if (end.getTime() >= Date.now()) activeSalePrice = record.sale_price;
            }
          }

          return {
            id: record.id,
            name: record.name,
            category: record.subcategory || record.category,
            signedThumb: thumb,
            price: record.price,
            salePrice: activeSalePrice,
          };
        });

        setResults(data);
        setDropdownOpen(true);
      } catch (err: any) {
        if (!err.isAbort) {
          console.error("Search error:", err);
          setResults([]);
        }
      }
    };

    const timer = setTimeout(fetchResults, 180);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Collections", path: "/collections" },
    { label: "New Arrivals & News", path: "/news" },
  ];

  return (
    <header className="navbar-header">
      <div className="promo-top-bar">
        Free Express Delivery on Orders Over $
        {Number.isInteger(freeThreshold) ? freeThreshold : freeThreshold.toFixed(2)} • Official{" "}
        <strong>DemoShop</strong> Online Store
      </div>
      <div className="navbar">
        <div className="navbar-content">
          {/* Generated DemoShop Brand Logo SVG */}
          <Link to="/" className="brand-logo-link" aria-label="DemoShop Home">
            <svg viewBox="0 0 215 48" className="demoshop-logo-svg">
              <defs>
                <linearGradient id="demoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#111827" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <rect x="2" y="6" width="36" height="36" rx="10" fill="url(#demoGrad)" />
              <path
                d="M13 18V15.5C13 12.4624 15.4624 10 18.5 10H21.5C24.5376 10 27 12.4624 27 15.5V18"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M10.5 18H29.5L28 33.5C27.75 35.5 26 37 24 37H16C14 37 12.25 35.5 12 33.5L10.5 18Z"
                fill="#ffffff"
                fillOpacity="0.92"
              />
              <text
                x="48"
                y="32"
                fontFamily="Inter, sans-serif"
                fontSize="24"
                fontWeight="800"
                fill="#0f172a"
                letterSpacing="-0.6"
              >
                Demo<tspan fill="#2563EB">Shop</tspan>
              </text>
            </svg>
          </Link>

          <nav className="buttons" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === "/collections" && location.pathname === "/kolekcje") ||
                (item.path === "/news" && location.pathname === "/nowosci");
              return (
                <Link key={item.path} to={item.path} className={`nav-link${isActive ? " active" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="icons-shop">
            {/* Upgraded Search Box */}
            <div className="search_for" ref={wrapperRef}>
              <Search className="search_icon_left" size={18} />
              <input
                id="search_items"
                className="search_items"
                type="search"
                placeholder="Search products, categories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => searchTerm && setDropdownOpen(true)}
                aria-label="Search products"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search_clear_btn"
                  onClick={() => {
                    setSearchTerm("");
                    setResults([]);
                  }}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}

              {dropdownOpen && searchTerm.trim() !== "" && (
                <div className="search-dropdown">
                  <div className="search-dropdown-title">
                    {results.length > 0 ? `Found ${results.length} matching products` : "No products found"}
                  </div>
                  {results.length > 0 && (
                    <ul className="search-results-list">
                      {results.map((r) => (
                        <li key={r.id} className="search-item">
                          <Link to={`/item/${r.id}`} onClick={() => setDropdownOpen(false)}>
                            <img src={r.signedThumb} alt={r.name} width={48} height={48} />
                            <div className="search-item-meta">
                              <span className="search-item-name">{r.name}</span>
                              {r.category && <span className="search-item-cat">{r.category}</span>}
                            </div>
                            <div className="search-price">
                              {r.salePrice ? (
                                <>
                                  <span className="search-price-sale">${r.salePrice.toFixed(2)}</span>
                                  <span className="search-price-old">${r.price.toFixed(2)}</span>
                                </>
                              ) : (
                                <span>${r.price ? r.price.toFixed(2) : "0.00"}</span>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="search-view-all-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate("/collections");
                    }}
                  >
                    Browse Full Catalog <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="shopping_cart">
              <Link to="/cart" className="shop-bag" aria-label="Shopping Cart">
                <ShoppingBag className="shopping_bag" size={24} />
                {cartCount > 0 && <div id="number_of_items">{cartCount}</div>}
              </Link>
            </div>

            <button
              type="button"
              className="mobile-only-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-search-container">
              <Search className="mobile-search-icon" size={18} />
              <input
                className="mobile-search-input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownOpen(true);
                }}
              />
            </div>

            {dropdownOpen && results.length > 0 && (
              <ul className="mobile-search-dropdown">
                {results.map((r) => (
                  <li key={r.id} className="mobile-search-item">
                    <Link
                      to={`/item/${r.id}`}
                      onClick={() => {
                        setDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <img src={r.signedThumb} alt={r.name} width={40} height={40} />
                      <span className="search-item-name">{r.name}</span>
                      <span className="search-price">
                        ${(r.salePrice || r.price || 0).toFixed(2)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link${location.pathname === item.path ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;