import type { Node } from "web-tree-sitter";

import type { ParseSourceFileResult } from "@/server/services/parsing/tree-sitter";

const LINES_PER_CHUNK = 60;
const LINE_OVERLAP = 8;

const SEMANTIC_NODE_TYPES = [
  "arrow_function",
  "class",
  "class_declaration",
  "class_definition",
  "class_specifier",
  "decorated_definition",
  "enum_declaration",
  "enum_item",
  "export_statement",
  "function_declaration",
  "function_definition",
  "function_expression",
  "function_item",
  "impl_item",
  "interface_declaration",
  "lexical_declaration",
  "method_declaration",
  "method_definition",
  "mod_item",
  "struct_item",
  "struct_specifier",
  "trait_item",
  "type_declaration",
] as const;

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".mts": "typescript",
  ".cts": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".py": "python",
  ".pyw": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".hpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".cs": "csharp",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".json": "json",
  ".toml": "toml",
  ".css": "css",
  ".scss": "scss",
  ".sass": "sass",
  ".less": "less",
  ".html": "html",
  ".htm": "html",
  ".vue": "vue",
  ".gql": "graphql",
  ".graphql": "graphql",
  ".md": "markdown",
  ".mdx": "mdx",
  ".sql": "sql",
  ".xml": "xml",
  ".svelte": "svelte",
};

export interface SourceChunk {
  repositoryId: string;
  filePath: string;
  language: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  content: string;
}

export interface ParsedFileInput {
  repositoryId: string;
  filePath: string;
  language: string;
  sourceText: string;
  parseResult: ParseSourceFileResult | null;
}

interface ChunkMetadata {
  repositoryId: string;
  filePath: string;
  language: string;
}

export function resolveLanguageFromExtension(extension: string): string {
  const normalizedExtension = extension.toLowerCase();

  const mappedLanguage = EXTENSION_TO_LANGUAGE[normalizedExtension];

  if (mappedLanguage) {
    return mappedLanguage;
  }

  const extensionLanguage = normalizedExtension.replace(/^\./, "");

  return extensionLanguage || "unknown";
}

function containsNode(outer: Node, inner: Node): boolean {
  return (
    outer.startIndex <= inner.startIndex &&
    outer.endIndex >= inner.endIndex &&
    (outer.startIndex < inner.startIndex || outer.endIndex > inner.endIndex)
  );
}

function selectInnermostSemanticNodes(nodes: Node[]): Node[] {
  return nodes.filter(
    (node) => !nodes.some((other) => other !== node && containsNode(node, other)),
  );
}

function extractLines(
  sourceText: string,
  startLine: number,
  endLine: number,
): string {
  const lines = sourceText.split("\n");

  return lines.slice(startLine - 1, endLine).join("\n");
}

function generateLineChunks(
  sourceText: string,
  metadata: ChunkMetadata,
): SourceChunk[] {
  const lines = sourceText.split("\n");

  if (lines.length === 0) {
    return [];
  }

  const chunks: SourceChunk[] = [];
  let lineIndex = 0;
  let chunkIndex = 0;

  while (lineIndex < lines.length) {
    const chunkEnd = Math.min(lineIndex + LINES_PER_CHUNK, lines.length);
    const startLine = lineIndex + 1;
    const endLine = chunkEnd;
    const content = lines.slice(lineIndex, chunkEnd).join("\n");

    if (content.trim().length > 0) {
      chunks.push({
        repositoryId: metadata.repositoryId,
        filePath: metadata.filePath,
        language: metadata.language,
        chunkIndex,
        startLine,
        endLine,
        content,
      });
      chunkIndex += 1;
    }

    if (chunkEnd >= lines.length) {
      break;
    }

    lineIndex += LINES_PER_CHUNK - LINE_OVERLAP;
  }

  return chunks;
}

function generateSemanticChunks(
  sourceText: string,
  parseResult: ParseSourceFileResult,
  metadata: ChunkMetadata,
): SourceChunk[] {
  const candidates = parseResult.tree.rootNode
    .descendantsOfType([...SEMANTIC_NODE_TYPES])
    .filter((node): node is Node => node !== null)
    .filter((node) => node.text.trim().length > 0);

  const semanticNodes = selectInnermostSemanticNodes(candidates).sort(
    (left, right) => left.startIndex - right.startIndex,
  );

  if (semanticNodes.length === 0) {
    return generateLineChunks(sourceText, metadata);
  }

  const totalLines = sourceText.split("\n").length;

  const semanticChunks = semanticNodes.map((node) => ({
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
  }));

  const gapRanges = findGapRanges(semanticChunks, totalLines);

  const allRanges = [
    ...semanticChunks.map((range) => ({ ...range, kind: "semantic" as const })),
    ...gapRanges.map((range) => ({ ...range, kind: "gap" as const })),
  ].sort((left, right) => left.startLine - right.startLine);

  const chunks: SourceChunk[] = [];

  for (let index = 0; index < allRanges.length; index++) {
    const range = allRanges[index];
    const content = extractLines(sourceText, range.startLine, range.endLine);

    if (content.trim().length === 0) {
      continue;
    }

    chunks.push({
      repositoryId: metadata.repositoryId,
      filePath: metadata.filePath,
      language: metadata.language,
      chunkIndex: chunks.length,
      startLine: range.startLine,
      endLine: range.endLine,
      content,
    });
  }

  return chunks;
}

interface LineRange {
  startLine: number;
  endLine: number;
}

function findGapRanges(
  coveredRanges: LineRange[],
  totalLines: number,
): LineRange[] {
  const gaps: LineRange[] = [];
  let cursor = 1;

  for (const range of coveredRanges) {
    if (cursor < range.startLine) {
      gaps.push({ startLine: cursor, endLine: range.startLine - 1 });
    }

    cursor = Math.max(cursor, range.endLine + 1);
  }

  if (cursor <= totalLines) {
    gaps.push({ startLine: cursor, endLine: totalLines });
  }

  return gaps;
}

export function generateChunks(parsedFile: ParsedFileInput): SourceChunk[] {
  const metadata: ChunkMetadata = {
    repositoryId: parsedFile.repositoryId,
    filePath: parsedFile.filePath,
    language: parsedFile.language,
  };

  if (!parsedFile.parseResult) {
    return generateLineChunks(parsedFile.sourceText, metadata);
  }

  return generateSemanticChunks(
    parsedFile.sourceText,
    parsedFile.parseResult,
    metadata,
  );
}
