import React, { useState, useEffect } from "react";
import { Item } from "../../types/item";
import "./ItemPage.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  X,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
} from "lucide-react";

export const ItemPage: React.FC<{ item: Item }> = ({ item }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    item.sizes && item.sizes.length === 1 ? item.sizes[0] : null
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const navigate = useNavigate();
  const { dispatch } = useCart();

  const imageUrls: string[] = Array.isArray(item.images)
    ? (item.images as string[])
    : typeof item.images === "string" && item.images !== ""
    ? [item.images]
    : [];

  let hasActivePromo = false;
  if (item.sale_price && item.sale_price > 0) {
    if (!item.sale_end_date) {
      hasActivePromo = true;
    } else {
      const endDate = new Date(item.sale_end_date);
      endDate.setHours(23, 59, 59, 999);
      hasActivePromo = endDate.getTime() >= Date.now();
    }
  }

  const activePrice = hasActivePromo ? item.sale_price! : item.price;
  const discountPerc = hasActivePromo
    ? Math.round(((item.price - item.sale_price!) / item.price) * 100)
    : 0;

  // Dynamic SEO Title & Schema.org Product JSON-LD
  useEffect(() => {
    document.title = `${item.name} — Buy Online | DemoShop`;
    const scriptId = "product-json-ld";
    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      name: item.name,
      image: imageUrls,
      description:
        item.description ||
        `${item.name} crafted from ${item.material || "premium fabric"}. Available at DemoShop.`,
      sku: `DS-${item.id}`,
      brand: { "@type": "Brand", name: "DemoShop" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: activePrice.toFixed(2),
        availability: "https://schema.org/InStock",
      },
    });
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [item, activePrice, imageUrls]);

  useEffect(() => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [imageUrls]);

  const handleAddToCart = () => {
    if (!selectedSize || !imageUrls.length) return;
    dispatch({
      type: "ADD_TO_CART",
      product: {
        id: item.id as string,
        name: item.name,
        imagePath: imageUrls[0],
        price: activePrice,
        size: selectedSize,
        originalPrice: item.price,
      },
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div className="itempage-container">
      <div className="itempage-back-row">
        <button
          className="itempage-back-btn"
          onClick={() => navigate("/collections")}
          type="button"
        >
          <ArrowLeft size={18} /> Back to Collections
        </button>
      </div>

      <article className="itempage-root">
        <div className="itempage-main">
          {/* Left Column: Multi-Photo Gallery + Thumbnails + Fullscreen Zoom */}
          <div className="itempage-photo-col">
            <div className="itempage-photo-wrapper">
              {imageUrls.length > 1 && (
                <button
                  aria-label="Previous image"
                  onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                  disabled={imgIdx === 0}
                  className="itempage-photo-nav itempage-photo-prev"
                  type="button"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {imageUrls.length > 0 && (
                <img
                  src={imageUrls[imgIdx]}
                  alt={`${item.name} - photo ${imgIdx + 1}`}
                  className="itempage-photo"
                  onClick={() => setLightboxOpen(true)}
                  loading="eager"
                />
              )}

              <button
                type="button"
                className="itempage-zoom-trigger"
                onClick={() => setLightboxOpen(true)}
                title="Enlarge photo"
              >
                <ZoomIn size={18} /> Fullscreen
              </button>

              {imageUrls.length > 1 && (
                <div className="itempage-photo-counter">
                  {imgIdx + 1} / {imageUrls.length}
                </div>
              )}

              {imageUrls.length > 1 && (
                <button
                  aria-label="Next image"
                  onClick={() => setImgIdx((i) => Math.min(imageUrls.length - 1, i + 1))}
                  disabled={imgIdx === imageUrls.length - 1}
                  className="itempage-photo-nav itempage-photo-next"
                  type="button"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {imageUrls.length > 1 && (
              <div className="itempage-thumbnails">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`itempage-thumb-btn ${index === imgIdx ? "active" : ""}`}
                    onClick={() => setImgIdx(index)}
                  >
                    <img src={url} alt={`${item.name} thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info, Sizes & Purchase Box */}
          <div className="itempage-info-col">
            <div className="itempage-breadcrumbs">
              <span>{item.category || "Collection"}</span>
              {item.subcategory && <span> • {item.subcategory}</span>}
              <span> • SKU: DS-{item.id.slice(0, 6).toUpperCase()}</span>
            </div>

            <h1 className="itempage-title">{item.name}</h1>

            <div className="itempage-price-container">
              {hasActivePromo ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                    <div className="itempage-price-new">${activePrice.toFixed(2)}</div>
                    <div className="itempage-price-old">${item.price.toFixed(2)}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <div className="itempage-discount-badge">You Save {discountPerc}%</div>
                    {item.sale_end_date && (
                      <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                        Offer valid until: {new Date(item.sale_end_date).toLocaleDateString("en-US")}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="itempage-price">${item.price.toFixed(2)}</div>
              )}
            </div>

            <p className="itempage-lead-summary">
              {item.description
                ? item.description.split("\n")[0]
                : "Designed for versatility and lasting comfort. Carefully tailored with reinforced seams and breathable fabric."}
            </p>

            <div className="itempage-size-group">
              <div className="itempage-size-header">
                <span className="itempage-size-label">Select Size</span>
                <span className="itempage-size-Status">● In Stock & Ready to Ship</span>
              </div>
              <div className="itempage-sizes">
                {item.sizes.map((size) => (
                  <button
                    key={size}
                    className={`itempage-size-btn${selectedSize === size ? " selected" : ""}`}
                    onClick={() => setSelectedSize(size)}
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="itempage-button"
              disabled={!selectedSize}
              onClick={handleAddToCart}
              type="button"
            >
              {addedToast ? (
                <>
                  <Check size={22} /> Added to Cart!
                </>
              ) : selectedSize ? (
                `Add to Shopping Cart — $${activePrice.toFixed(2)}`
              ) : (
                "Select a Size to Continue"
              )}
            </button>

            {/* Value Propositions */}
            <div className="itempage-perks">
              <div className="perk-row">
                <Truck size={18} color="#2563eb" />
                <span>Free express delivery on orders over $249 (1–2 business days)</span>
              </div>
              <div className="perk-row">
                <RotateCcw size={18} color="#2563eb" />
                <span>30-day hassle-free return & size exchange guarantee</span>
              </div>
              <div className="perk-row">
                <ShieldCheck size={18} color="#2563eb" />
                <span>Verified DemoShop quality & secure encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rich Extended Descriptions & SEO Specifications */}
        <div className="itempage-details">
          <div className="detail-card">
            <h3 className="itempage-details-title">Detailed Product Description</h3>
            <div className="itempage-details-text">
              {item.description ||
                `${item.name} is part of the latest DemoShop collection. Engineered for daily durability, modern silhouette, and effortless styling across seasons.`}
            </div>
          </div>

          <div className="detail-card">
            <h3 className="itempage-details-title">Material & Care Instructions</h3>
            <div className="itempage-details-text">
              <strong>Composition:</strong> {item.material || "Premium certified textile blend"}
              {"\n\n"}
              <strong>Care Guide:</strong>
              {"\n"}• Machine wash cold (max 30°C) on gentle cycle
              {"\n"}• Wash inside out with similar colors
              {"\n"}• Do not bleach or tumble dry on high heat
              {"\n"}• Iron on low temperature if needed
            </div>
          </div>
        </div>
      </article>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && imageUrls.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen view"
          >
            <X size={28} />
          </button>
          <img
            src={imageUrls[imgIdx]}
            alt={item.name}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ItemPage;