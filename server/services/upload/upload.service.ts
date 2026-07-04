import { randomUUID } from "node:crypto";

import { env } from "@/config/env";
import type { Repository, RepositoryStatus } from "@/server/db/schema";
import {
  createRepository,
  updateRepository,
} from "@/server/repositories/repository.repo";
import { generateEmbeddings } from "@/server/services/embedding/embedding.service";
import { removeRepositoryDir } from "@/server/services/ingestion/file-store";
import { extractZip } from "@/server/services/ingestion/zip-extractor";
import { discoverRepositoryFiles } from "@/server/services/parsing/parser.service";
import { indexRepositoryChunks } from "@/server/services/vector/vector-index.service";

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

function transitionStatus(
  repositoryId: string,
  status: RepositoryStatus,
  data?: Record<string, unknown>,
): Repository {
  const updated = updateRepository(repositoryId, { status, ...data });

  if (!updated) {
    throw new Error(`Failed to transition repository to "${status}"`);
  }

  return updated;
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

  try {
    transitionStatus(repository.id, "extracting");

    const extraction = await extractZip({
      repositoryId: repository.id,
      zipBuffer: input.fileBuffer,
      maxFiles: env.maxFilesPerRepo,
      maxExtractedBytes: getMaxExtractedBytes(),
    });

    transitionStatus(repository.id, "parsing", {
      totalFiles: extraction.fileCount,
    });

    const parseResults = await discoverRepositoryFiles(repository.id);
    const chunks = parseResults.flatMap((result) => result.chunks);

    transitionStatus(repository.id, "embedding", {
      fileCount: parseResults.length,
      filesProcessed: parseResults.length,
      chunkCount: chunks.length,
    });

    const embeddings = await generateEmbeddings(chunks);
    const { pointsIndexed } = await indexRepositoryChunks(
      repository.id,
      embeddings,
    );

    return transitionStatus(repository.id, "ready", {
      errorMessage: null,
      chunksIndexed: pointsIndexed,
    });
  } catch (error) {
    await removeRepositoryDir(repository.id).catch((cleanupError) => {
      console.error("Failed to clean up extracted files:", cleanupError);
    });

    const message =
      error instanceof Error ? error.message : "Upload processing failed";

    return transitionStatus(repository.id, "failed", {
      errorMessage: message,
    });
  }
}
