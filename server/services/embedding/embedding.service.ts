import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

import { getOpenAIConfig } from "@/config/env";
import type { SourceChunk } from "@/server/services/parsing/chunk-generator";

const EMBEDDING_MODEL_ID = "text-embedding-3-small";
const EMBEDDING_BATCH_SIZE = 64;

export interface ChunkEmbedding {
  chunk: SourceChunk;
  embedding: number[];
}

function createEmbeddingModel() {
  const { apiKey } = getOpenAIConfig();

  return createOpenAI({ apiKey }).embedding(EMBEDDING_MODEL_ID);
}

async function embedChunkBatch(
  chunks: SourceChunk[],
  model: ReturnType<typeof createEmbeddingModel>,
): Promise<ChunkEmbedding[]> {
  const { embeddings } = await embedMany({
    model,
    values: chunks.map((chunk) => chunk.content),
  });

  return chunks.map((chunk, index) => ({
    chunk,
    embedding: [...embeddings[index]],
  }));
}

export async function generateEmbeddings(
  chunks: SourceChunk[],
): Promise<ChunkEmbedding[]> {
  if (chunks.length === 0) {
    return [];
  }

  const model = createEmbeddingModel();
  const results: ChunkEmbedding[] = [];

  for (let index = 0; index < chunks.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(index, index + EMBEDDING_BATCH_SIZE);
    const batchResults = await embedChunkBatch(batch, model);

    results.push(...batchResults);
  }

  return results;
}
