import { api, setToken, clearToken } from "./apiClient";

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export async function login(email: string, password: string) {
  const result = await api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password });
  setToken(result.token);
  return result.user;
}

export function logout() {
  clearToken();
}

export async function me() {
  return api.get<AuthUser>("/auth/me");
}
