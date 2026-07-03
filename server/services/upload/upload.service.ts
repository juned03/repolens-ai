import { randomUUID } from "node:crypto";

import { env } from "@/config/env";
import type { Repository } from "@/server/db/schema";
import {
  createRepository,
  updateRepository,
} from "@/server/repositories/repository.repo";
import { removeRepositoryDir } from "@/server/services/ingestion/file-store";
import { extractZip } from "@/server/services/ingestion/zip-extractor";

export interface UploadInput {
  fileName: string;
  fileBuffer: Buffer;
}

function generateRepositoryName(fileName: string): string {
  const nameWithoutExtension = fileName.replace(/\.zip$/i, "").trim();

  return nameWithoutExtension || "repository";
}

function getMaxExtractedBytes(): number {
  return env.maxUploadSizeMb * 1024 * 1024;
}

export async function startUpload(input: UploadInput): Promise<Repository> {
  const id = randomUUID();
  const name = generateRepositoryName(input.fileName);

  const repository = createRepository({
    id,
    name,
    status: "pending",
    fileCount: 0,
    chunkCount: 0,
    filesProcessed: 0,
    totalFiles: 0,
    chunksIndexed: 0,
  });

  const extracting = updateRepository(repository.id, { status: "extracting" });

  if (!extracting) {
    throw new Error("Failed to update repository status");
  }

  try {
    const extraction = await extractZip({
      repositoryId: repository.id,
      zipBuffer: input.fileBuffer,
      maxFiles: env.maxFilesPerRepo,
      maxExtractedBytes: getMaxExtractedBytes(),
    });

    const ready = updateRepository(repository.id, {
      status: "ready",
      errorMessage: null,
      fileCount: extraction.fileCount,
      totalFiles: extraction.fileCount,
    });

    if (!ready) {
      throw new Error("Failed to update repository after extraction");
    }

    return ready;
  } catch (error) {
    await removeRepositoryDir(repository.id).catch((cleanupError) => {
      console.error("Failed to clean up extracted files:", cleanupError);
    });

    const message =
      error instanceof Error ? error.message : "ZIP extraction failed";

    const failed = updateRepository(repository.id, {
      status: "failed",
      errorMessage: message,
    });

    if (!failed) {
      throw new Error("Failed to mark repository as failed");
    }

    return failed;
  }
}
