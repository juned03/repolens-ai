import {
  discoverSourceFiles,
  type DiscoveredSourceFile,
} from "@/server/services/parsing/file-discovery";

export type { DiscoveredSourceFile };

export async function discoverRepositoryFiles(
  repositoryId: string,
): Promise<DiscoveredSourceFile[]> {
  return discoverSourceFiles(repositoryId);
}
