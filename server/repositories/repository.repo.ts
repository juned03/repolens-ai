import { desc, eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import {
  repositories,
  type NewRepository,
  type Repository,
  type RepositoryStatus,
} from "@/server/db/schema";

export function createRepository(data: NewRepository): Repository {
  return db.insert(repositories).values(data).returning().get();
}

export function getRepositoryById(id: string): Repository | null {
  const repository = db
    .select()
    .from(repositories)
    .where(eq(repositories.id, id))
    .get();

  return repository ?? null;
}

export function getAllRepositories(): Repository[] {
  return db
    .select()
    .from(repositories)
    .orderBy(desc(repositories.createdAt))
    .all();
}

export function updateRepositoryStatus(
  id: string,
  status: RepositoryStatus,
): Repository | null {
  const repository = db
    .update(repositories)
    .set({ status })
    .where(eq(repositories.id, id))
    .returning()
    .get();

  return repository ?? null;
}

export function deleteRepository(id: string): void {
  db.delete(repositories).where(eq(repositories.id, id)).run();
}
