export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  active: boolean;
  order: number;
}

// REGLA ABSOLUTA: nunca stock/inventario/cantidad disponible. Solo ACTIVO/INACTIVO.
export interface Product {
  id: string;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  price: number;
  categoryId: string;
  category?: Category;
  status: "ACTIVO" | "INACTIVO";
  order: number;
}

export interface DailyMenuItem {
  id: string;
  label: string;
  emoji?: string | null;
}

export interface DailyMenu {
  id: string;
  date: string;
  active: boolean;
  items: DailyMenuItem[];
}

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  displaySeconds: number;
  active: boolean;
  order: number;
}

export interface Carousel {
  id: string;
  images: CarouselImage[];
}

export type OrderStatus = "RECIBIDO" | "EN_PREPARACION" | "LISTO" | "ENTREGADO" | "CANCELADO";

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  number: number;
  date: string;
  total: number;
  status: OrderStatus;
  student: { name: string; grade: string; group?: string | null };
  items: OrderItem[];
}
