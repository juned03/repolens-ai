import { randomUUID } from "node:crypto";

import type { Repository } from "@/server/db/schema";
import { createRepository } from "@/server/repositories/repository.repo";

export interface UploadMetadata {
  fileName: string;
}

function generateRepositoryName(fileName: string): string {
  const nameWithoutExtension = fileName.replace(/\.zip$/i, "").trim();

  return nameWithoutExtension || "repository";
}

export function startUpload(metadata: UploadMetadata): Repository {
  const id = randomUUID();
  const name = generateRepositoryName(metadata.fileName);

  return createRepository({
    id,
    name,
    status: "pending",
    fileCount: 0,
    chunkCount: 0,
    filesProcessed: 0,
    totalFiles: 0,
    chunksIndexed: 0,
  });
}
