import "dotenv/config";
import { discoverRepositoryFiles } from "@/server/services/parsing/parser.service";
import { generateEmbeddings } from "@/server/services/embedding/embedding.service";

async function main(): Promise<void> {
  const repositoryId = process.argv[2];

  if (!repositoryId) {
    console.error("Usage: npm run test:embeddings -- <repositoryId>");
    process.exit(1);
  }

  console.log("Discovering and parsing files...");
  const results = await discoverRepositoryFiles(repositoryId);
  const chunks = results.flatMap((result) => result.chunks);

  console.log("Generating embeddings...\n");
  const embeddings = await generateEmbeddings(chunks);

  const dimension = embeddings[0]?.embedding.length ?? 0;

  console.log(`Repository ID: ${repositoryId}`);
  console.log(`Files discovered: ${results.length}`);
  console.log(`Chunks generated: ${chunks.length}`);
  console.log(`Embeddings generated: ${embeddings.length}`);
  console.log(`Embedding dimension: ${dimension}`);

  if (embeddings.length > 0) {
    const first = embeddings[0];
    const preview = first.embedding.slice(0, 10).map((n) => n.toFixed(6));

    console.log("\n--- First embedding ---");
    console.log(`File: ${first.chunk.filePath}`);
    console.log(`Lines: ${first.chunk.startLine}-${first.chunk.endLine}`);
    console.log(`Embedding length: ${first.embedding.length}`);
    console.log(`First 10 numbers: [${preview.join(", ")}]`);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Embedding verification failed: ${message}`);
    process.exit(1);
  });
