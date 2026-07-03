import fs from "node:fs";
import path from "node:path";

import { IGNORED_DIRECTORY_NAMES } from "@/config/ingestion";
import { isSupportedSourceFile } from "@/server/services/ingestion/file-filter";
import { getRepositoryDir } from "@/server/services/ingestion/file-store";

const DISCOVERY_IGNORED_DIRECTORIES = new Set([
  ...IGNORED_DIRECTORY_NAMES,
  ".next",
]);

export interface DiscoveredSourceFile {
  path: string;
  extension: string;
  size: number;
}

function isIgnoredDirectoryName(directoryName: string): boolean {
  return DISCOVERY_IGNORED_DIRECTORIES.has(directoryName.toLowerCase());
}

function toRepositoryRelativePath(
  repositoryDir: string,
  absolutePath: string,
): string {
  return path.relative(repositoryDir, absolutePath).split(path.sep).join("/");
}

function getFileExtension(relativePath: string): string {
  const baseName = path.posix.basename(relativePath).toLowerCase();

  return path.posix.extname(baseName);
}

async function walkDirectory(
  repositoryDir: string,
  currentDir: string,
  discovered: DiscoveredSourceFile[],
): Promise<void> {
  const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (isIgnoredDirectoryName(entry.name)) {
        continue;
      }

      await walkDirectory(repositoryDir, absolutePath, discovered);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = toRepositoryRelativePath(repositoryDir, absolutePath);

    if (!isSupportedSourceFile(relativePath)) {
      continue;
    }

    const stats = await fs.promises.stat(absolutePath);

    discovered.push({
      path: relativePath,
      extension: getFileExtension(relativePath),
      size: stats.size,
    });
  }
}

export async function discoverSourceFiles(
  repositoryId: string,
): Promise<DiscoveredSourceFile[]> {
  const repositoryDir = getRepositoryDir(repositoryId);

  try {
    const stats = await fs.promises.stat(repositoryDir);

    if (!stats.isDirectory()) {
      throw new Error(`Repository path is not a directory: ${repositoryId}`);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(`Repository directory not found: ${repositoryId}`);
    }

    throw error;
  }

  const discovered: DiscoveredSourceFile[] = [];
  await walkDirectory(repositoryDir, repositoryDir, discovered);

  return discovered.sort((left, right) => left.path.localeCompare(right.path));
}
