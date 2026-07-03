import fs from "node:fs";
import path from "node:path";

import { getRepositoryDir } from "@/server/services/ingestion/file-store";
import {
  discoverSourceFiles,
  type DiscoveredSourceFile,
} from "@/server/services/parsing/file-discovery";
import {
  generateChunks,
  resolveLanguageFromExtension,
  type SourceChunk,
} from "@/server/services/parsing/chunk-generator";
import {
  parseSourceFile,
  type ParseSourceFileResult,
} from "@/server/services/parsing/tree-sitter";

export type { DiscoveredSourceFile, ParseSourceFileResult, SourceChunk };

export interface RepositoryFileParseResult {
  file: DiscoveredSourceFile;
  parseResult: ParseSourceFileResult | null;
  chunks: SourceChunk[];
}

async function readSourceText(
  repositoryId: string,
  filePath: string,
): Promise<string> {
  const absolutePath = path.join(getRepositoryDir(repositoryId), filePath);

  return fs.promises.readFile(absolutePath, "utf8");
}

export async function discoverRepositoryFiles(
  repositoryId: string,
): Promise<RepositoryFileParseResult[]> {
  const files = await discoverSourceFiles(repositoryId);

  return Promise.all(
    files.map(async (file) => {
      const parseResult = await parseSourceFile({
        repositoryId,
        path: file.path,
        extension: file.extension,
      });

      const sourceText =
        parseResult?.sourceText ??
        (await readSourceText(repositoryId, file.path));

      const chunks = generateChunks({
        repositoryId,
        filePath: file.path,
        language:
          parseResult?.language ??
          resolveLanguageFromExtension(file.extension),
        sourceText,
        parseResult,
      });

      return {
        file,
        parseResult,
        chunks,
      };
    }),
  );
}
