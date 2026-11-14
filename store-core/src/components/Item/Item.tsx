// src/components/Item/Item.tsx
import React, { useState } from "react";
import { Item } from "../../types/item";
import { Link } from "react-router-dom";
import "../Catalog/Catalog.css";

export const ItemPreview: React.FC<{ item: Item }> = ({ item }) => {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageList: string[] = Array.isArray(item.images)
    ? item.images.filter(Boolean)
    : typeof item.images === "string" && item.images !== ""
    ? [item.images]
    : [];

  const hasImage = imageList.length > 0 && !imgError;
  const primaryImage = hasImage ? imageList[0] : "";
  const secondaryImage = imageList.length > 1 ? imageList[1] : primaryImage;

  let hasActivePromo = false;
  if (item.sale_price && item.sale_price > 0) {
    if (!item.sale_end_date) {
      hasActivePromo = true;
    } else {
      const endDate = new Date(item.sale_end_date);
      endDate.setHours(23, 59, 59, 999);
      if (endDate.getTime() >= Date.now()) {
        hasActivePromo = true;
      }
    }
  }

  const activePrice = hasActivePromo ? item.sale_price! : item.price;
  const discountPerc = hasActivePromo
    ? Math.round(((item.price - item.sale_price!) / item.price) * 100)
    : 0;

  return (
    <Link
      to={`/item/${item.id}`}
      className="item-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="item-image-stage">
        {hasActivePromo && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              backgroundColor: "#dc2626",
              color: "#fff",
              padding: "5px 10px",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 800,
              zIndex: 5,
              boxShadow: "0 4px 10px rgba(220, 38, 38, 0.3)",
            }}
          >
            SAVE {discountPerc}%
          </div>
        )}

        {imageList.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              color: "#fff",
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "0.7rem",
              fontWeight: 600,
              zIndex: 5,
            }}
          >
            {imageList.length} Photos
          </div>
        )}

        {hasImage ? (
          <img
            src={hovered ? secondaryImage : primaryImage}
            alt={item.name}
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f1f5f9",
              color: "#64748b",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "center",
              padding: "12px",
            }}
          >
            No Image
          </div>
        )}
      </div>

      <div className="item-card-body">
        <span className="item-category-tag">
          {item.subcategory || item.category || "Apparel"}
        </span>
        <h3 className="item-name">{item.name}</h3>

        <p className="item-short-desc">
          {item.description
            ? item.description
            : item.material
            ? `Material: ${item.material}. Designed for everyday comfort.`
            : "Premium DemoShop collection piece crafted with high attention to detail."}
        </p>

        {Array.isArray(item.sizes) && item.sizes.length > 0 && (
          <div className="item-sizes-preview">
            {item.sizes.slice(0, 5).map((sz) => (
              <span key={sz} className="size-chip-mini">
                {sz}
              </span>
            ))}
          </div>
        )}

        <div className="item-card-footer">
          <div>
            {hasActivePromo ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "0.8rem" }}>
                  ${item.price?.toFixed(2)}
                </span>
                <span style={{ color: "#dc2626", fontWeight: 800, fontSize: "1.15rem" }}>
                  ${activePrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span style={{ color: "#0f172a", fontWeight: 800, fontSize: "1.15rem" }}>
                ${item.price?.toFixed(2)}
              </span>
            )}
          </div>

          <span className="details-btn">View Item</span>
        </div>
      </div>
    </Link>
  );
};