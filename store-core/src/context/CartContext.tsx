import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";

export interface Product {
  id: string;
  name: string;
  price: number;
  imagePath: string;
  size: string;
  originalPrice?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type Action =
  | { type: "ADD_TO_CART"; product: Product }
  | { type: "REMOVE_ONE_FROM_CART"; productId: string; size: string }
  | { type: "REMOVE_ALL_FROM_CART"; productId: string; size: string }
  | { type: "CLEAR_CART" }
  | { type: "SYNC_PRICES"; updatedProducts: { id: string; price: number; originalPrice: number }[] };

const initialState: CartState = { items: [] };

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const idx = state.items.findIndex(
        (item) => item.product.id === action.product.id && item.product.size === action.product.size
      );
      if (idx !== -1) {
        const updated = [...state.items];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + 1,
        };
        return { items: updated };
      }
      return {
        items: [...state.items, { product: action.product, quantity: 1 }],
      };
    }
    case "REMOVE_ONE_FROM_CART": {
      const idx = state.items.findIndex(
        (item) => item.product.id === action.productId && item.product.size === action.size
      );
      if (idx === -1) return state;
      const updated = [...state.items];
      if (updated[idx].quantity > 1) {
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity - 1,
        };
        return { items: updated };
      }
      updated.splice(idx, 1);
      return { items: updated };
    }
    case "REMOVE_ALL_FROM_CART": {
      // FIXED: Filter out the matching product+size instead of keeping only the matching one
      return {
        items: state.items.filter(
          (item) => !(item.product.id === action.productId && item.product.size === action.size)
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };

    case "SYNC_PRICES": {
      let changed = false;
      const newItems = state.items.map((item) => {
        const live = action.updatedProducts.find((p) => p.id === item.product.id);
        if (
          live &&
          (item.product.price !== live.price || item.product.originalPrice !== live.originalPrice)
        ) {
          changed = true;
          return {
            ...item,
            product: {
              ...item.product,
              price: live.price,
              originalPrice: live.originalPrice,
            },
          };
        }
        return item;
      });
      return changed ? { items: newItems } : state;
    }
    default:
      return state;
  }
}

interface ContextProps {
  state: CartState;
  dispatch: React.Dispatch<Action>;
}

const CartContext = createContext<ContextProps | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, (init) => {
    try {
      if (typeof window === "undefined") return init;
      const stored = localStorage.getItem("cart");
      return stored ? (JSON.parse(stored) as CartState) : init;
    } catch {
      return init;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(state));
      }
    } catch {
      // ignore storage errors
    }
  }, [state]);

  return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};