import path from "node:path";

import yauzl from "yauzl";

import { shouldExtractEntry } from "@/server/services/ingestion/file-filter";
import {
  ensureRepositoryDir,
  writeFileFromStream,
} from "@/server/services/ingestion/file-store";

export interface ExtractZipOptions {
  repositoryId: string;
  zipBuffer: Buffer;
  maxFiles: number;
  maxExtractedBytes: number;
}

export interface ExtractZipResult {
  fileCount: number;
  totalBytes: number;
}

export class ZipExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipExtractionError";
  }
}

function resolveSafeEntryPath(
  repositoryDir: string,
  entryPath: string,
): string | null {
  const normalizedEntryPath = entryPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const destinationPath = path.resolve(
    repositoryDir,
    ...normalizedEntryPath.split("/").filter(Boolean),
  );
  const resolvedRepositoryDir = path.resolve(repositoryDir);
  const relativeDestination = path.relative(resolvedRepositoryDir, destinationPath);

  if (
    relativeDestination.startsWith("..") ||
    path.isAbsolute(relativeDestination)
  ) {
    return null;
  }

  return destinationPath;
}

export async function extractZip(
  options: ExtractZipOptions,
): Promise<ExtractZipResult> {
  const repositoryDir = await ensureRepositoryDir(options.repositoryId);
  const zipFile = await yauzl.fromBufferPromise(options.zipBuffer, {
    lazyEntries: true,
    validateEntrySizes: true,
  });

  let fileCount = 0;
  let totalBytes = 0;

  try {
    for await (const entry of zipFile.eachEntry()) {
      if (!shouldExtractEntry(entry.fileName)) {
        continue;
      }

      const destinationPath = resolveSafeEntryPath(
        repositoryDir,
        entry.fileName,
      );

      if (!destinationPath) {
        throw new ZipExtractionError("Unsafe ZIP entry path detected");
      }

      if (totalBytes + entry.uncompressedSize > options.maxExtractedBytes) {
        throw new ZipExtractionError(
          "Extracted content exceeds maximum allowed size",
        );
      }

      if (fileCount + 1 > options.maxFiles) {
        throw new ZipExtractionError(
          "Repository exceeds maximum number of source files",
        );
      }

      const readStream = await zipFile.openReadStreamPromise(entry);
      await writeFileFromStream(destinationPath, readStream);

      fileCount += 1;
      totalBytes += entry.uncompressedSize;
    }

    return { fileCount, totalBytes };
  } finally {
    zipFile.close();
  }
}
