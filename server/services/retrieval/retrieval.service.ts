import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

import { getOpenAIConfig } from "@/config/env";
import {
  qdrantClient,
  CODE_CHUNKS_COLLECTION,
} from "@/server/clients/qdrant.client";

const EMBEDDING_MODEL_ID = "text-embedding-3-small";
const TOP_K = 8;

export interface RetrievedChunk {
  filePath: string;
  content: string;
  language: string;
  startLine: number;
  endLine: number;
  similarityScore: number;
}

interface ChunkPayload {
  filePath: string;
  content: string;
  language: string;
  startLine: number;
  endLine: number;
}

function createEmbeddingModel() {
  const { apiKey } = getOpenAIConfig();

  return createOpenAI({ apiKey }).embedding(EMBEDDING_MODEL_ID);
}

async function embedQuestion(question: string): Promise<number[]> {
  const { embedding } = await embed({
    model: createEmbeddingModel(),
    value: question,
  });

  return [...embedding];
}

function parsePayload(payload: Record<string, unknown> | null | undefined): ChunkPayload | null {
  if (!payload) {
    return null;
  }

  const filePath = payload.filePath;
  const content = payload.content;
  const language = payload.language;
  const startLine = payload.startLine;
  const endLine = payload.endLine;

  if (
    typeof filePath !== "string" ||
    typeof content !== "string" ||
    typeof language !== "string" ||
    typeof startLine !== "number" ||
    typeof endLine !== "number"
  ) {
    return null;
  }

  return { filePath, content, language, startLine, endLine };
}

export async function retrieveRelevantChunks(
  repositoryId: string,
  question: string,
): Promise<RetrievedChunk[]> {
  const queryVector = await embedQuestion(question);

  const results = await qdrantClient.search(CODE_CHUNKS_COLLECTION, {
    vector: queryVector,
    limit: TOP_K,
    with_payload: true,
    filter: {
      must: [{ key: "repositoryId", match: { value: repositoryId } }],
    },
  });

  const chunks: RetrievedChunk[] = [];

  for (const point of results) {
    const payload = parsePayload(point.payload as Record<string, unknown>);

    if (!payload) {
      continue;
    }

    chunks.push({
      filePath: payload.filePath,
      content: payload.content,
      language: payload.language,
      startLine: payload.startLine,
      endLine: payload.endLine,
      similarityScore: point.score,
    });
  }

  return chunks;
}
