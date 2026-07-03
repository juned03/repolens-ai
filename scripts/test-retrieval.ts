import "dotenv/config";
import { retrieveRelevantChunks } from "@/server/services/retrieval/retrieval.service";

const CONTENT_PREVIEW_LENGTH = 200;

function formatPreview(content: string): string {
  if (content.length <= CONTENT_PREVIEW_LENGTH) {
    return content;
  }

  return `${content.slice(0, CONTENT_PREVIEW_LENGTH)}...`;
}

async function main(): Promise<void> {
  const repositoryId = process.argv[2];
  const question = process.argv[3];

  if (!repositoryId || !question) {
    console.error(
      'Usage: npm run test:retrieval -- <repositoryId> "<question>"',
    );
    process.exit(1);
  }

  console.log(`Question: ${question}\n`);

  const chunks = await retrieveRelevantChunks(repositoryId, question);

  console.log(`Retrieved chunks: ${chunks.length}\n`);

  for (const [index, chunk] of chunks.entries()) {
    console.log(`--- Chunk ${index + 1} ---`);
    console.log(`Similarity score: ${chunk.similarityScore.toFixed(4)}`);
    console.log(`File: ${chunk.filePath}`);
    console.log(`Language: ${chunk.language}`);
    console.log(`Lines: ${chunk.startLine}-${chunk.endLine}`);
    console.log(`Content: ${formatPreview(chunk.content)}`);
    console.log();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Retrieval verification failed: ${message}`);
    process.exit(1);
  });
