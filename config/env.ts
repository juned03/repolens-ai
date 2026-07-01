import { z } from "zod";

const envSchema = z.object({
  openaiApiKey: z
    .string({
      error: "OPENAI_API_KEY is required",
    })
    .min(1, "OPENAI_API_KEY is required"),
  qdrantUrl: z
    .string()
    .url("QDRANT_URL must be a valid URL")
    .default("http://localhost:6333"),
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

export type Env = z.infer<typeof envSchema>;

function formatValidationError(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join(".") : "environment";
    return `  - ${field}: ${issue.message}`;
  });

  return ["Invalid environment configuration:", ...lines].join("\n");
}

function parseEnv(): Env {
  const result = envSchema.safeParse({
    openaiApiKey: process.env.OPENAI_API_KEY,
    qdrantUrl: process.env.QDRANT_URL,
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

export const env: Env = parseEnv();
