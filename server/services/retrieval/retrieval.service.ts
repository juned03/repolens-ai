import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

import { getOpenAIConfig } from "@/config/env";
import {
  qdrantClient,
  CODE_CHUNKS_COLLECTION,
} from "@/server/clients/qdrant.client";

const EMBEDDING_MODEL_ID = "text-embedding-3-small";
const TOP_K = 8;
const CANDIDATE_MULTIPLIER = 3;
const KEYWORD_BOOST_WEIGHT = 0.15;
const MIN_KEYWORD_LENGTH = 3;

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

const STOP_WORDS = new Set([
  "the", "is", "at", "which", "on", "a", "an", "and", "or", "not",
  "in", "to", "for", "of", "with", "by", "from", "as", "into",
  "this", "that", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would",
  "should", "could", "can", "may", "might", "shall", "must",
  "where", "what", "when", "how", "why", "who", "whom",
  "its", "it", "they", "them", "their", "there", "here",
  "all", "each", "every", "any", "some", "no", "only", "own",
  "about", "after", "before", "between", "through", "during",
  "above", "below", "up", "down", "out", "off", "over", "under",
  "used", "use", "using", "called", "call", "file", "code",
  "function", "method", "class", "does",
]);

function extractKeywords(question: string): string[] {
  const tokens = question
    .toLowerCase()
    .split(/[^a-zA-Z0-9_]+/)
    .filter((token) => token.length >= MIN_KEYWORD_LENGTH)
    .filter((token) => !STOP_WORDS.has(token));

  return [...new Set(tokens)];
}

function computeKeywordScore(
  keywords: string[],
  content: string,
  filePath: string,
): number {
  if (keywords.length === 0) {
    return 0;
  }

  const searchText = `${content}\n${filePath}`.toLowerCase();
  let matched = 0;

  for (const keyword of keywords) {
    if (searchText.includes(keyword)) {
      matched += 1;
    }
  }

  return matched / keywords.length;
}

export async function retrieveRelevantChunks(
  repositoryId: string,
  question: string,
): Promise<RetrievedChunk[]> {
  const keywords = extractKeywords(question);
  const queryVector = await embedQuestion(question);

  const results = await qdrantClient.search(CODE_CHUNKS_COLLECTION, {
    vector: queryVector,
    limit: TOP_K * CANDIDATE_MULTIPLIER,
    with_payload: true,
    filter: {
      must: [{ key: "repositoryId", match: { value: repositoryId } }],
    },
  });

  const scored: RetrievedChunk[] = [];

  for (const point of results) {
    const payload = parsePayload(point.payload as Record<string, unknown>);

    if (!payload) {
      continue;
    }

    const keywordScore = computeKeywordScore(
      keywords,
      payload.content,
      payload.filePath,
    );

    scored.push({
      filePath: payload.filePath,
      content: payload.content,
      language: payload.language,
      startLine: payload.startLine,
      endLine: payload.endLine,
      similarityScore: point.score + KEYWORD_BOOST_WEIGHT * keywordScore,
    });
  }

  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, TOP_K);
}
