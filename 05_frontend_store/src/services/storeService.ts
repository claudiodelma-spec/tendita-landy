import { api } from "./apiClient";
import type { Category, Product, DailyMenu, Carousel, Order } from "../types/store";

export const storeService = {
  // Section 21-26: the parent-facing catalog. Categories/products come back
  // unfiltered from the API today — the store UI filters to `active`/`ACTIVO`
  // itself (see HomePage/ProductsPage) until a dedicated public endpoint exists.
  listActiveCategories: async () => {
    const categories = await api.get<Category[]>("/categories");
    return categories.filter((c) => c.active).sort((a, b) => a.order - b.order);
  },
  listActiveProducts: async () => {
    const products = await api.get<Product[]>("/products");
    return products.filter((p) => p.status === "ACTIVO").sort((a, b) => a.order - b.order);
  },
  getTodayMenu: () => api.get<DailyMenu | null>("/menu/today"),
  getCarousel: () => api.get<Carousel | null>("/carousel"),

  // Section 29/30 — creates the order and returns the ready-to-open WhatsApp link.
  createOrder: (data: {
    student: { name: string; grade: string; group?: string };
    items: { productId: string; quantity: number }[];
  }) =>
    api.post<{ order: Order; whatsappMessage: string; whatsappUrl: string; mode: string }>("/orders", data),

  listMyOrders: () => api.get<Order[]>("/orders"),
};
