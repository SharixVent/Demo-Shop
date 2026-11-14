// src/api/api.ts
import pb, { fileUrl } from "./pocketbase";
import type { Item } from "../types/item";

function mapPBItem(record: any): Item {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    subcategory: record.subcategory,
    price: record.price,
    sizes: record.sizes ?? [],
    description: record.description ?? "",
    material: record.material ?? "",
    images: (record.images ?? []).map((file: string) => fileUrl(record, file)),
    sale_price: record.sale_price || undefined,
    sale_end_date: record.sale_end_date || "",
  };
}

export async function getItems(): Promise<Item[]> {
  const list = await pb.collection("items").getFullList({ requestKey: null });
  return list.map(mapPBItem);
}

export async function getItem(id: string): Promise<Item> {
  const record = await pb.collection("items").getOne(id, { requestKey: null });
  return mapPBItem(record);
}

export async function getNews() {
  const news = await pb.collection("news").getFullList({
    sort: "-created",
    requestKey: null,
  });
  return news.map((n: any) => ({
    ...n,
    image_url: n.image_url ? fileUrl(n, n.image_url) : null,
  }));
}

export async function getSections() {
  return await pb.collection("sections").getFullList({
    sort: "order",
    requestKey: null,
  });
}

export interface OrderItemPayload {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  imagePath?: string;
}

export interface StoreSettings {
  courier: number;
  parcel_locker: number;
  freeThreshold: number;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const records = await pb.collection("store_settings").getFullList({
      requestKey: null,
    });

    if (records && records.length > 0) {
      const record: any = records[0];

      const rawCourier = record.courier_price ?? record.kurier_price;
      const rawLocker = record.parcel_locker_price ?? record.paczkomat_price;
      const rawThreshold = record.free_delivery_threshold;

      return {
        courier: rawCourier !== undefined && rawCourier !== "" ? Number(rawCourier) : 15.0,
        parcel_locker: rawLocker !== undefined && rawLocker !== "" ? Number(rawLocker) : 14.0,
        freeThreshold: rawThreshold !== undefined && rawThreshold !== "" ? Number(rawThreshold) : 249.0,
      };
    }
  } catch (err) {
    console.warn("Could not fetch store_settings from PocketBase, falling back to defaults:", err);
  }

  return {
    courier: 15.0,
    parcel_locker: 14.0,
    freeThreshold: 249.0,
  };
}

export async function createOrder(
  email: string,
  items: OrderItemPayload[],
  customerData: {
    firstName: string;
    lastName: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    clientType: string;
    companyName: string;
    nip: string;
    notes: string;
    delivery_method: string;
    delivery_cost: number;
  }
) {
  const sanitizedItems = items
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      size: String(item.size),
      quantity: Number(item.quantity),
      price: Number(item.price),
      imagePath: item.imagePath ? String(item.imagePath) : undefined,
    }))
    .filter((item) => item.quantity > 0 && item.price >= 0);

  if (sanitizedItems.length === 0) {
    throw new Error("No valid items in the order.");
  }

  const total = sanitizedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const normalizedEmail = String(email).trim();

  const payload = {
    email: normalizedEmail,
    customer_email: normalizedEmail,
    order_number: `ORD-${Date.now()}`,
    items: sanitizedItems,
    total,
    status: "unpaid",
    first_name: customerData.firstName,
    last_name: customerData.lastName,
    street: customerData.street,
    house_number: customerData.houseNumber,
    postal_code: customerData.postalCode,
    city: customerData.city,
    delivery_method: customerData.delivery_method,
    delivery_cost: customerData.delivery_cost,
    clientType: customerData.clientType,
    companyName: customerData.companyName,
    nip: customerData.nip,
    notes: customerData.notes,
  };

  try {
    return await pb.collection("orders").create(payload);
  } catch (err: any) {
    const errorBody = err?.response?.data || err?.response || err?.message || err;
    console.warn("Order create failed:", errorBody);
    throw new Error(
      typeof errorBody === "string"
        ? errorBody
        : JSON.stringify(errorBody, Object.keys(errorBody || {}), 2)
    );
  }
}