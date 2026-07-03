import { createHash } from "node:crypto";

import type { ChunkEmbedding } from "@/server/services/embedding/embedding.service";
import {
  qdrantClient,
  ensureQdrantCollection,
  CODE_CHUNKS_COLLECTION,
} from "@/server/clients/qdrant.client";

const UPSERT_BATCH_SIZE = 100;

const REPOLENS_UUID_NAMESPACE = "a3f1c9e7-5d24-4b8a-9c6e-2f0d7b8e1a4c";

interface ChunkPointPayload {
  repositoryId: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  chunkIndex: number;
  content: string;
}

function buildDeterministicPointId(
  repositoryId: string,
  filePath: string,
  chunkIndex: number,
): string {
  const name = `${repositoryId}:${filePath}:${chunkIndex}`;
  const hash = createHash("sha1")
    .update(REPOLENS_UUID_NAMESPACE)
    .update(name)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

function toPoint(item: ChunkEmbedding) {
  const { chunk, embedding } = item;

  const payload: ChunkPointPayload = {
    repositoryId: chunk.repositoryId,
    filePath: chunk.filePath,
    language: chunk.language,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
  };

  return {
    id: buildDeterministicPointId(
      chunk.repositoryId,
      chunk.filePath,
      chunk.chunkIndex,
    ),
    vector: embedding,
    payload: payload as unknown as Record<string, unknown>,
  };
}

export interface IndexResult {
  pointsIndexed: number;
}

export async function indexRepositoryChunks(
  chunksWithEmbeddings: ChunkEmbedding[],
): Promise<IndexResult> {
  if (chunksWithEmbeddings.length === 0) {
    return { pointsIndexed: 0 };
  }

  await ensureQdrantCollection();

  const points = chunksWithEmbeddings.map(toPoint);

  for (let offset = 0; offset < points.length; offset += UPSERT_BATCH_SIZE) {
    const batch = points.slice(offset, offset + UPSERT_BATCH_SIZE);

    await qdrantClient.upsert(CODE_CHUNKS_COLLECTION, {
      wait: true,
      points: batch,
    });
  }

  return { pointsIndexed: points.length };
}
