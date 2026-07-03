import path from "node:path";

import {
  IGNORED_DIRECTORY_NAMES,
  SUPPORTED_SOURCE_EXTENSIONS,
  SUPPORTED_SPECIAL_FILENAMES,
} from "@/config/ingestion";

function normalizeZipEntryPath(entryPath: string): string {
  return entryPath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function getZipEntrySegments(entryPath: string): string[] {
  return normalizeZipEntryPath(entryPath).split("/").filter(Boolean);
}

export function hasIgnoredDirectory(segments: string[]): boolean {
  return segments.some((segment) =>
    IGNORED_DIRECTORY_NAMES.has(segment.toLowerCase()),
  );
}

export function isSupportedSourceFile(relativePath: string): boolean {
  const normalizedPath = normalizeZipEntryPath(relativePath);
  const baseName = path.posix.basename(normalizedPath).toLowerCase();

  if (SUPPORTED_SPECIAL_FILENAMES.has(baseName)) {
    return true;
  }

  const extension = path.posix.extname(baseName);

  if (!extension) {
    return false;
  }

  return SUPPORTED_SOURCE_EXTENSIONS.has(extension);
}

export function shouldExtractEntry(entryPath: string): boolean {
  const normalizedPath = normalizeZipEntryPath(entryPath);

  if (!normalizedPath || normalizedPath.endsWith("/")) {
    return false;
  }

  const segments = getZipEntrySegments(normalizedPath);

  if (hasIgnoredDirectory(segments)) {
    return false;
  }

  return isSupportedSourceFile(normalizedPath);
}
