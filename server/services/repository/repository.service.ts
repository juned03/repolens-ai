import {
  deleteRepository,
  getRepositoryById,
} from "@/server/repositories/repository.repo";
import { removeRepositoryDir } from "@/server/services/ingestion/file-store";
import { deleteRepositoryVectors } from "@/server/services/vector/vector-index.service";

export async function deleteRepositoryById(repositoryId: string): Promise<void> {
  const repository = getRepositoryById(repositoryId);

  if (!repository) {
    throw new Error(`Repository not found: ${repositoryId}`);
  }

  try {
    await deleteRepositoryVectors(repositoryId);
  } catch (error) {
    console.error("Failed to delete Qdrant vectors:", error);
  }

  try {
    await removeRepositoryDir(repositoryId);
  } catch (error) {
    console.error("Failed to remove extracted files:", error);
  }

  deleteRepository(repositoryId);
}
