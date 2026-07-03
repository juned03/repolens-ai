import { discoverRepositoryFiles } from "@/server/services/parsing/parser.service";
import type { SourceChunk } from "@/server/services/parsing/chunk-generator";

const CONTENT_PREVIEW_LENGTH = 200;

function formatPreview(content: string): string {
  if (content.length <= CONTENT_PREVIEW_LENGTH) {
    return content;
  }

  return `${content.slice(0, CONTENT_PREVIEW_LENGTH)}...`;
}

function printSummary(
  repositoryId: string,
  fileCount: number,
  parsedCount: number,
  totalChunks: number,
): void {
  console.log(`Repository ID: ${repositoryId}`);
  console.log(`Number of discovered files: ${fileCount}`);
  console.log(`Number of successfully parsed files: ${parsedCount}`);
  console.log(`Total chunks generated: ${totalChunks}`);
}

function printChunkPreviews(chunks: SourceChunk[]): void {
  const previewChunks = chunks.slice(0, 5);

  if (previewChunks.length === 0) {
    console.log("\nNo chunks generated.");
    return;
  }

  console.log("\nFirst generated chunks:\n");

  for (const [index, chunk] of previewChunks.entries()) {
    console.log(`--- Chunk ${index + 1} ---`);
    console.log(`File: ${chunk.filePath}`);
    console.log(`Language: ${chunk.language}`);
    console.log(`Lines: ${chunk.startLine}-${chunk.endLine}`);
    console.log(`Content preview: ${formatPreview(chunk.content)}`);
    console.log();
  }
}

async function main(): Promise<void> {
  const repositoryId = process.argv[2];

  if (!repositoryId) {
    console.error("Usage: npm run test:chunking -- <repositoryId>");
    process.exit(1);
  }

  const results = await discoverRepositoryFiles(repositoryId);
  const parsedCount = results.filter((result) => result.parseResult !== null).length;
  const chunks = results.flatMap((result) => result.chunks);

  printSummary(repositoryId, results.length, parsedCount, chunks.length);
  printChunkPreviews(chunks);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Chunking verification failed: ${message}`);
    process.exit(1);
  });
