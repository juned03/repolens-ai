import type { RepositoryStatus } from "@/server/db/schema";

export type { RepositoryStatus };

export interface RepositorySummary {
  id: string;
  name: string;
  status: RepositoryStatus;
  fileCount: number;
  chunkCount: number;
  createdAt: string;
}

export interface RepositoriesResponse {
  repositories: RepositorySummary[];
}

export interface UploadResponse {
  repositoryId: string;
  repositoryName: string;
  status: RepositoryStatus;
}
