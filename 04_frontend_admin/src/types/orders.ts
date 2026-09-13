export type OrderStatus = "RECIBIDO" | "EN_PREPARACION" | "LISTO" | "ENTREGADO" | "CANCELADO";

export interface OrderItem {
  id: string;
  productId: string;
  product?: { name: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  changedAt: string;
  notes?: string | null;
}

export interface Order {
  id: string;
  number: number;
  date: string;
  total: number;
  status: OrderStatus;
  student: { name: string; grade: string; group?: string | null };
  items: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
}
