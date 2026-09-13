import { api } from "./apiClient";
import type { Setting } from "../types/settings";

export const settingsService = {
  list: () => api.get<Setting[]>("/settings"),
  update: (id: string, value: string) => api.put<Setting>(`/settings/${id}`, { value }),
  create: (key: string, value: string, category: Setting["category"]) =>
    api.post<Setting>("/settings", { key, value, category }),
};
