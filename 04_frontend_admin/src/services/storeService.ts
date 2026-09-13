import { api } from "./apiClient";
import type { Category, Product, DailyMenu, Carousel, CarouselImage } from "../types/store";

export const storeService = {
  listCategories: () => api.get<Category[]>("/categories"),
  createCategory: (data: Partial<Category>) => api.post<Category>("/categories", data),
  updateCategory: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.del<void>(`/categories/${id}`),

  listProducts: () => api.get<Product[]>("/products"),
  createProduct: (data: Partial<Product>) => api.post<Product>("/products", data),
  updateProduct: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  deleteProduct: (id: string) => api.del<void>(`/products/${id}`),

  listMenus: () => api.get<DailyMenu[]>("/menu"),
  createMenu: (data: { date: string; active?: boolean; items: { label: string; emoji?: string; order?: number }[] }) =>
    api.post<DailyMenu>("/menu", data),
  setMenuActive: (id: string, active: boolean) => api.put<DailyMenu>(`/menu/${id}/active`, { active }),
  deleteMenu: (id: string) => api.del<void>(`/menu/${id}`),

  getCarousel: () => api.get<Carousel | null>("/carousel"),
  addCarouselImage: (data: Partial<CarouselImage>) => api.post<CarouselImage>("/carousel/images", data),
  updateCarouselImage: (id: string, data: Partial<CarouselImage>) =>
    api.put<CarouselImage>(`/carousel/images/${id}`, data),
  deleteCarouselImage: (id: string) => api.del<void>(`/carousel/images/${id}`),
};
