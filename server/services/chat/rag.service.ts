import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import { getOpenAIConfig } from "@/config/env";
import {
  retrieveRelevantChunks,
  type RetrievedChunk,
} from "@/server/services/retrieval/retrieval.service";

const CHAT_MODEL_ID = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a code documentation assistant for a software repository.

Rules:
- Answer ONLY using the provided repository context below.
- If the answer cannot be found in the context, explicitly say: "This information is not present in the repository."
- Never invent or fabricate code that is not in the context.
- Cite the relevant file path(s) you used to form your answer.
- Keep answers concise and technically accurate.
- When referencing code, mention the file path and line range.`;

export interface RagAnswer {
  answer: string;
  retrievedChunks: RetrievedChunk[];
}

function formatContextBlock(chunk: RetrievedChunk, index: number): string {
  const header = `[${index + 1}] ${chunk.filePath} (${chunk.language}, lines ${chunk.startLine}-${chunk.endLine})`;

  return `${header}\n${chunk.content}`;
}

function buildUserPrompt(
  chunks: RetrievedChunk[],
  question: string,
): string {
  if (chunks.length === 0) {
    return `No relevant code was found in the repository.\n\nQuestion: ${question}`;
  }

  const context = chunks.map(formatContextBlock).join("\n\n---\n\n");

  return `Repository context:\n\n${context}\n\n---\n\nQuestion: ${question}`;
}

export async function answerRepositoryQuestion(
  repositoryId: string,
  question: string,
): Promise<RagAnswer> {
  const retrievedChunks = await retrieveRelevantChunks(
    repositoryId,
    question,
  );

  const { apiKey } = getOpenAIConfig();
  const model = createOpenAI({ apiKey })(CHAT_MODEL_ID);

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(retrievedChunks, question),
  });

  return {
    answer: text,
    retrievedChunks,
  };
}
