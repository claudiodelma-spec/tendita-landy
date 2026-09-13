import { api } from "./apiClient";

interface DriveStatus {
  mode: "MOCK" | "REAL";
  folderConfigured: boolean;
}
interface UploadResult {
  driveUrl: string;
  mode: "MOCK" | "REAL";
}
interface BackupResult {
  path: string;
  mode: "MOCK" | "REAL";
  timestamp: string;
  tables: string[];
}

export const driveService = {
  getStatus: () => api.get<DriveStatus>("/drive/status"),
  mockUpload: (filename: string) => api.post<UploadResult>("/drive/upload", { filename }),
  createBackup: () => api.post<BackupResult>("/drive/backup"),
};
