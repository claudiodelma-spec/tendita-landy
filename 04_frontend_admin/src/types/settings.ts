export type SettingCategory = "BUSINESS" | "FINANCE" | "STORE" | "CAROUSEL" | "SYSTEM";

export interface Setting {
  id: string;
  key: string;
  value: string;
  category: SettingCategory;
}
