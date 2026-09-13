export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export const IS_SANDBOX = (import.meta.env.VITE_ENVIRONMENT ?? "SANDBOX") === "SANDBOX";
