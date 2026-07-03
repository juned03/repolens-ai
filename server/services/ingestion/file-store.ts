import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { env } from "@/config/env";

export function getRepositoryDir(repositoryId: string): string {
  return path.join(env.dataDir, "repositories", repositoryId);
}

export async function ensureRepositoryDir(repositoryId: string): Promise<string> {
  const repositoryDir = getRepositoryDir(repositoryId);
  await fs.promises.mkdir(repositoryDir, { recursive: true });
  return repositoryDir;
}

export async function writeFileFromStream(
  destinationPath: string,
  stream: NodeJS.ReadableStream,
): Promise<void> {
  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
  await pipeline(stream, fs.createWriteStream(destinationPath));
}

export async function removeRepositoryDir(repositoryId: string): Promise<void> {
  await fs.promises.rm(getRepositoryDir(repositoryId), {
    recursive: true,
    force: true,
  });
}
