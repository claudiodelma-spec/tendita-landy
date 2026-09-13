export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  active: boolean;
  order: number;
}

// REGLA ABSOLUTA: nunca agregar stock/inventario a este tipo.
export interface Product {
  id: string;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  price: number;
  categoryId: string;
  category?: Category;
  status: "ACTIVO" | "INACTIVO";
  schedule?: string | null;
  order: number;
}

export interface DailyMenuItem {
  id: string;
  label: string;
  emoji?: string | null;
  order: number;
}

export interface DailyMenu {
  id: string;
  date: string;
  active: boolean;
  items: DailyMenuItem[];
}

export interface CarouselImage {
  id: string;
  carouselId: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  displaySeconds: number;
  active: boolean;
  order: number;
}

export interface Carousel {
  id: string;
  maxSlots: number;
  images: CarouselImage[];
}
