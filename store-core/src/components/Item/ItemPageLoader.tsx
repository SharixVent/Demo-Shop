import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ItemPage from "./ItemPage";
import type { Item } from "../../types/item";
import Loader from "../Loader/Loader";
import { getItem } from "../../api/api";

export const ItemPageLoader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!id) {
      setTimedOut(true);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setTimedOut(true);
      setLoading(false);
    }, 10_000);

    (async () => {
      try {
        const data = await getItem(id);
        setItem(data);
      } catch (err) {
        console.error("PocketBase error:", err);
        setTimedOut(true);
      } finally {
        setLoading(false);
      }
    })();

    return () => clearTimeout(timer);
  }, [id]);

  if (loading && !timedOut) {
    return <Loader />;
  }

  if (!item) {
    return (
      <div
        style={{
          display: "flex",
          height: "60vh",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          color: "#64748b",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        The requested product could not be found or is no longer available.
      </div>
    );
  }

  return <ItemPage item={item} />;
};

export default ItemPageLoader;