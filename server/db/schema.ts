import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const repositoryStatusValues = [
  "pending",
  "extracting",
  "parsing",
  "embedding",
  "ready",
  "failed",
] as const;

export type RepositoryStatus = (typeof repositoryStatusValues)[number];

export const chatRoleValues = ["user", "assistant", "system"] as const;

export type ChatRole = (typeof chatRoleValues)[number];

export interface MessageCitation {
  filePath: string;
  startLine: number;
  endLine: number;
}

export const repositories = sqliteTable("repositories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").$type<RepositoryStatus>().notNull(),
  errorMessage: text("error_message"),
  fileCount: integer("file_count").notNull().default(0),
  chunkCount: integer("chunk_count").notNull().default(0),
  filesProcessed: integer("files_processed").notNull().default(0),
  totalFiles: integer("total_files").notNull().default(0),
  chunksIndexed: integer("chunks_indexed").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sourceFiles = sqliteTable(
  "source_files",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    language: text("language").notNull(),
    lineCount: integer("line_count").notNull(),
    contentHash: text("content_hash").notNull(),
  },
  (table) => [
    uniqueIndex("source_files_repository_id_path_unique").on(
      table.repositoryId,
      table.path,
    ),
    index("source_files_repository_id_idx").on(table.repositoryId),
  ],
);

export const chatSessions = sqliteTable(
  "chat_sessions",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("chat_sessions_repository_id_idx").on(table.repositoryId),
  ],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").$type<ChatRole>().notNull(),
    content: text("content").notNull(),
    citations: text("citations", { mode: "json" }).$type<
      MessageCitation[] | null
    >(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("chat_messages_session_id_idx").on(table.sessionId)],
);

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;

export type SourceFile = typeof sourceFiles.$inferSelect;
export type NewSourceFile = typeof sourceFiles.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
