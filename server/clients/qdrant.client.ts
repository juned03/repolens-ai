import { QdrantClient } from "@qdrant/js-client-rest";

import { env } from "@/config/env";

/** OpenAI text-embedding-3-small vector dimensions. */
export const EMBEDDING_VECTOR_SIZE = 1536;

/** Qdrant collection for indexed code chunks (see architecture plan). */
export const CODE_CHUNKS_COLLECTION = "code_chunks";

function createQdrantClient(): QdrantClient {
  return new QdrantClient({ url: env.qdrantUrl });
}

const globalForQdrant = globalThis as typeof globalThis & {
  qdrant?: QdrantClient;
  qdrantBootstrap?: Promise<void>;
};

export const qdrantClient: QdrantClient =
  globalForQdrant.qdrant ?? createQdrantClient();

if (process.env.NODE_ENV !== "production") {
  globalForQdrant.qdrant = qdrantClient;
}

async function bootstrapCodeChunksCollection(): Promise<void> {
  const { exists } = await qdrantClient.collectionExists(
    CODE_CHUNKS_COLLECTION,
  );

  if (exists) {
    return;
  }

  await qdrantClient.createCollection(CODE_CHUNKS_COLLECTION, {
    vectors: {
      size: EMBEDDING_VECTOR_SIZE,
      distance: "Cosine",
    },
  });
}

/** Ensures the code_chunks collection exists. Safe to call multiple times. */
export function ensureQdrantCollection(): Promise<void> {
  if (!globalForQdrant.qdrantBootstrap) {
    globalForQdrant.qdrantBootstrap = bootstrapCodeChunksCollection();
  }

  return globalForQdrant.qdrantBootstrap;
}
