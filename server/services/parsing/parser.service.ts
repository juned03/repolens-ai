import {
  discoverSourceFiles,
  type DiscoveredSourceFile,
} from "@/server/services/parsing/file-discovery";
import {
  parseSourceFile,
  type ParseSourceFileResult,
} from "@/server/services/parsing/tree-sitter";

export type { DiscoveredSourceFile, ParseSourceFileResult };

export interface RepositoryFileParseResult {
  file: DiscoveredSourceFile;
  parseResult: ParseSourceFileResult | null;
}

export async function discoverRepositoryFiles(
  repositoryId: string,
): Promise<RepositoryFileParseResult[]> {
  const files = await discoverSourceFiles(repositoryId);

  return Promise.all(
    files.map(async (file) => ({
      file,
      parseResult: await parseSourceFile({
        repositoryId,
        path: file.path,
        extension: file.extension,
      }),
    })),
  );
}
