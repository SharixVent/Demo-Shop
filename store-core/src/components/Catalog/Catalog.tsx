// src/components/Catalog/Catalog.tsx
import React, { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Categories } from "../Categories/Categories";
import { ItemPreview } from "../Item/Item";
import { Item } from "../../types/item";
import "./Catalog.css";
import Loader from "../Loader/Loader";
import { getItems } from "../../api/api";

const Catalog: React.FC = () => {
  const [selected, setSelected] = useState<{ [k: string]: boolean }>({});
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "a-z" | "z-a" | "">("");
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filtersCountAtApply, setFiltersCountAtApply] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Product Catalog & Collections | DemoShop";
    setLoading(true);
    getItems()
      .then((data) => {
        setItems(data);
        setFilteredItems(data);
      })
      .catch((err) => console.error("PocketBase getItems error:", err))
      .finally(() => setLoading(false));
  }, []);

  const applyFiltersAndSort = (
    currentFilters: { [k: string]: boolean },
    currentSort: "asc" | "desc" | "a-z" | "z-a" | ""
  ) => {
    const keys = Object.keys(currentFilters).filter((k) => currentFilters[k]);
    setFiltersCountAtApply(keys.length);

    let result =
      keys.length === 0
        ? [...items]
        : items.filter((item) => {
            const key = `${item.category}-${item.subcategory.toLowerCase()}`;
            return currentFilters[key];
          });

    const getEffectivePrice = (it: Item) => {
      if (it.sale_price && it.sale_price > 0) {
        if (!it.sale_end_date) return it.sale_price;
        const end = new Date(it.sale_end_date);
        end.setHours(23, 59, 59, 999);
        if (end.getTime() >= Date.now()) return it.sale_price;
      }
      return it.price;
    };

    if (currentSort === "asc") {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (currentSort === "desc") {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (currentSort === "a-z") {
      result.sort((a, b) => a.name.localeCompare(b.name, "en"));
    } else if (currentSort === "z-a") {
      result.sort((a, b) => b.name.localeCompare(a.name, "en"));
    }

    setFilteredItems(result);
    setFiltersApplied(true);
  };

  const handleApplyFilters = () => {
    applyFiltersAndSort(selected, sortOrder);
    setSidebarOpen(false);
  };

  const handleClearFilters = () => {
    setSelected({});
    setSortOrder("");
    setFilteredItems(items);
    setFiltersCountAtApply(0);
    setFiltersApplied(false);
    setSidebarOpen(false);
  };

  const handleSortChange = (newOrder: "asc" | "desc" | "a-z" | "z-a" | "") => {
    setSortOrder(newOrder);
    applyFiltersAndSort(selected, newOrder);
  };

  if (loading) return <Loader />;

  return (
    <div className="catalog-container">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        type="button"
      >
        {sidebarOpen ? (
          <>
            <X size={18} /> Close Filters
          </>
        ) : (
          <>
            <SlidersHorizontal size={18} /> Filter & Sort
          </>
        )}
      </button>

      <aside className={`catalog-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Categories
          selected={selected}
          onChange={(k, v) => setSelected((s) => ({ ...s, [k]: v }))}
          onClearFilters={handleClearFilters}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />

        <button className="show-btn" onClick={handleApplyFilters} type="button">
          Apply Filters ({Object.values(selected).filter(Boolean).length})
        </button>
      </aside>

      <section className="catalog-main">
        <div className="catalog-header-row">
          <div>
            <h1 className="catalog-title">
              {filtersApplied && filtersCountAtApply > 0
                ? `Filtered Products (${filteredItems.length})`
                : "Complete Collection"}
            </h1>
            <p className="catalog-subtitle">
              Discover high-quality essentials with detailed fabric descriptions and fast shipping.
            </p>
          </div>
          <span className="catalog-count-pill">{filteredItems.length} Products</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="catalog-empty-box">
            <h3>No products match your selected filters</h3>
            <p>Try clearing some category filters to see more results.</p>
            <button className="show-btn" style={{ maxWidth: 220, marginTop: 16 }} onClick={handleClearFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item) => (
              <ItemPreview key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Catalog;