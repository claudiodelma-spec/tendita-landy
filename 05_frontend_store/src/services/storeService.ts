import { api } from "./apiClient";
import type { Category, Product, DailyMenu, Carousel, Order } from "../types/store";

// Tienda pública — sin autenticación. Todo pasa por /api/public/*.
export const storeService = {
  listActiveCategories: () => api.get<Category[]>("/public/categories"),
  listActiveProducts: () => api.get<Product[]>("/public/products"),
  getTodayMenu: () => api.get<DailyMenu | null>("/public/menu/today"),
  getCarousel: () => api.get<Carousel | null>("/public/carousel"),
  getBusinessInfo: () => api.get<{ name: string; logo: string }>("/public/business-info"),

  // Section 29/30 — crea el pedido y devuelve el link de WhatsApp listo para abrir.
  createOrder: (data: {
    student: { name: string; grade: string; group?: string };
    items: { productId: string; quantity: number }[];
  }) =>
    api.post<{ order: Order; whatsappMessage: string; whatsappUrl: string; mode: string }>("/public/orders", data),
};
