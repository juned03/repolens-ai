import "dotenv/config";
import { answerRepositoryQuestion } from "@/server/services/chat/rag.service";

async function main(): Promise<void> {
  const repositoryId = process.argv[2];
  const question = process.argv[3];

  if (!repositoryId || !question) {
    console.error('Usage: npm run test:rag -- <repositoryId> "<question>"');
    process.exit(1);
  }

  const { answer, retrievedChunks } = await answerRepositoryQuestion(
    repositoryId,
    question,
  );

  const filePaths = [
    ...new Set(retrievedChunks.map((chunk) => chunk.filePath)),
  ];

  console.log(`Question: ${question}\n`);
  console.log(`Answer:\n${answer}\n`);
  console.log(`Retrieved chunks: ${retrievedChunks.length}`);
  console.log(`Retrieved file paths:\n${filePaths.map((p) => `  - ${p}`).join("\n")}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`RAG verification failed: ${message}`);
    process.exit(1);
  });
