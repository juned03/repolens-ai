import "dotenv/config";
import { discoverRepositoryFiles } from "@/server/services/parsing/parser.service";
import { generateEmbeddings } from "@/server/services/embedding/embedding.service";
import { indexRepositoryChunks } from "@/server/services/vector/vector-index.service";
import {
  qdrantClient,
  CODE_CHUNKS_COLLECTION,
} from "@/server/clients/qdrant.client";

async function main(): Promise<void> {
  const repositoryId = process.argv[2];

  if (!repositoryId) {
    console.error("Usage: npm run test:qdrant -- <repositoryId>");
    process.exit(1);
  }

  console.log("Discovering and parsing files...");
  const results = await discoverRepositoryFiles(repositoryId);
  const chunks = results.flatMap((result) => result.chunks);

  console.log("Generating embeddings...");
  const embeddings = await generateEmbeddings(chunks);

  console.log("Indexing into Qdrant...\n");
  const { pointsIndexed } = await indexRepositoryChunks(embeddings);

  console.log(`Repository ID: ${repositoryId}`);
  console.log(`Files discovered: ${results.length}`);
  console.log(`Chunks generated: ${chunks.length}`);
  console.log(`Embeddings generated: ${embeddings.length}`);
  console.log(`Points indexed: ${pointsIndexed}`);
  console.log(`Collection name: ${CODE_CHUNKS_COLLECTION}`);

  const { count } = await qdrantClient.count(CODE_CHUNKS_COLLECTION, {
    filter: {
      must: [{ key: "repositoryId", match: { value: repositoryId } }],
    },
    exact: true,
  });

  console.log(`\nQdrant verification: ${count} points found for this repository`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Qdrant verification failed: ${message}`);
    process.exit(1);
  });
