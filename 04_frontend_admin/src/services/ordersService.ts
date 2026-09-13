import { api } from "./apiClient";
import type { Order, OrderStatus } from "../types/orders";

export const ordersService = {
  list: (filters?: { status?: OrderStatus }) => {
    const query = filters?.status ? `?status=${filters.status}` : "";
    return api.get<Order[]>(`/orders${query}`);
  },
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus, notes?: string) =>
    api.put<Order>(`/orders/${id}/status`, { status, notes }),
};
