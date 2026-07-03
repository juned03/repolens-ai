import { z } from "zod";

const coreEnvSchema = z.object({
  databaseUrl: z.string().min(1).default("./data/repolens.db"),
  dataDir: z.string().min(1).default("./data"),
  maxUploadSizeMb: z.coerce
    .number()
    .int("MAX_UPLOAD_SIZE_MB must be an integer")
    .positive("MAX_UPLOAD_SIZE_MB must be greater than 0")
    .default(50),
  maxFilesPerRepo: z.coerce
    .number()
    .int("MAX_FILES_PER_REPO must be an integer")
    .positive("MAX_FILES_PER_REPO must be greater than 0")
    .default(500),
});

const qdrantUrlSchema = z.string().url("QDRANT_URL must be a valid URL");

/** Application configuration validated at startup. */
export type Env = z.infer<typeof coreEnvSchema>;

/** Configuration required for AI features (embeddings, LLM, vector search). */
export interface AIConfig {
  openaiApiKey: string;
  qdrantUrl: string;
}

function formatValidationError(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join(".") : "environment";
    return `  - ${field}: ${issue.message}`;
  });

  return ["Invalid environment configuration:", ...lines].join("\n");
}

function validateOptionalAIEnvFormat(): void {
  const qdrantUrl = process.env.QDRANT_URL;

  if (qdrantUrl !== undefined && qdrantUrl.length > 0) {
    const result = qdrantUrlSchema.safeParse(qdrantUrl);

    if (!result.success) {
      throw new Error(formatValidationError(result.error));
    }
  }
}

function parseCoreEnv(): Env {
  validateOptionalAIEnvFormat();

  const result = coreEnvSchema.safeParse({
    databaseUrl: process.env.DATABASE_URL,
    dataDir: process.env.DATA_DIR,
    maxUploadSizeMb: process.env.MAX_UPLOAD_SIZE_MB,
    maxFilesPerRepo: process.env.MAX_FILES_PER_REPO,
  });

  if (!result.success) {
    throw new Error(formatValidationError(result.error));
  }

  return result.data;
}

export const env: Env = parseCoreEnv();

export function getOpenAIConfig(): { apiKey: string } {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for AI features");
  }

  return { apiKey };
}

export function getQdrantConfig(): { url: string } {
  const rawUrl = process.env.QDRANT_URL ?? "http://localhost:6333";
  const result = qdrantUrlSchema.safeParse(rawUrl);

  if (!result.success) {
    throw new Error(formatValidationError(result.error));
  }

  return { url: result.data };
}

export function requireAIConfig(): AIConfig {
  const { apiKey } = getOpenAIConfig();
  const { url } = getQdrantConfig();

  return {
    openaiApiKey: apiKey,
    qdrantUrl: url,
  };
}
