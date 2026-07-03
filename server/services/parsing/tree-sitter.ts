import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

import { Language, Parser, type Tree } from "web-tree-sitter";

import { getRepositoryDir } from "@/server/services/ingestion/file-store";

const require = createRequire(import.meta.url);

const WASM_DIRECTORY = path.dirname(
  require.resolve("tree-sitter-wasms/out/tree-sitter-javascript.wasm"),
);

const RUNTIME_WASM_PATH = require.resolve("web-tree-sitter/tree-sitter.wasm");

interface GrammarSpec {
  grammarFile: string;
  languageName: string;
}

const EXTENSION_TO_GRAMMAR: Record<string, GrammarSpec> = {
  ".ts": { grammarFile: "typescript", languageName: "typescript" },
  ".mts": { grammarFile: "typescript", languageName: "typescript" },
  ".cts": { grammarFile: "typescript", languageName: "typescript" },
  ".tsx": { grammarFile: "tsx", languageName: "tsx" },
  ".js": { grammarFile: "javascript", languageName: "javascript" },
  ".mjs": { grammarFile: "javascript", languageName: "javascript" },
  ".cjs": { grammarFile: "javascript", languageName: "javascript" },
  ".jsx": { grammarFile: "javascript", languageName: "javascript" },
  ".py": { grammarFile: "python", languageName: "python" },
  ".pyw": { grammarFile: "python", languageName: "python" },
  ".go": { grammarFile: "go", languageName: "go" },
  ".rs": { grammarFile: "rust", languageName: "rust" },
  ".java": { grammarFile: "java", languageName: "java" },
  ".kt": { grammarFile: "kotlin", languageName: "kotlin" },
  ".kts": { grammarFile: "kotlin", languageName: "kotlin" },
  ".c": { grammarFile: "c", languageName: "c" },
  ".h": { grammarFile: "c", languageName: "c" },
  ".cpp": { grammarFile: "cpp", languageName: "cpp" },
  ".hpp": { grammarFile: "cpp", languageName: "cpp" },
  ".cc": { grammarFile: "cpp", languageName: "cpp" },
  ".cxx": { grammarFile: "cpp", languageName: "cpp" },
  ".cs": { grammarFile: "c_sharp", languageName: "csharp" },
  ".rb": { grammarFile: "ruby", languageName: "ruby" },
  ".php": { grammarFile: "php", languageName: "php" },
  ".swift": { grammarFile: "swift", languageName: "swift" },
  ".sh": { grammarFile: "bash", languageName: "bash" },
  ".bash": { grammarFile: "bash", languageName: "bash" },
  ".zsh": { grammarFile: "bash", languageName: "bash" },
  ".yaml": { grammarFile: "yaml", languageName: "yaml" },
  ".yml": { grammarFile: "yaml", languageName: "yaml" },
  ".json": { grammarFile: "json", languageName: "json" },
  ".toml": { grammarFile: "toml", languageName: "toml" },
  ".css": { grammarFile: "css", languageName: "css" },
  ".scss": { grammarFile: "css", languageName: "scss" },
  ".sass": { grammarFile: "css", languageName: "sass" },
  ".less": { grammarFile: "css", languageName: "less" },
  ".html": { grammarFile: "html", languageName: "html" },
  ".htm": { grammarFile: "html", languageName: "html" },
  ".vue": { grammarFile: "vue", languageName: "vue" },
  ".gql": { grammarFile: "ql", languageName: "graphql" },
  ".graphql": { grammarFile: "ql", languageName: "graphql" },
};

export interface ParseSourceFileInput {
  repositoryId: string;
  path: string;
  extension: string;
}

export interface ParseSourceFileResult {
  tree: Tree;
  language: string;
  sourceText: string;
}

let parserInitPromise: Promise<void> | null = null;
let sharedParser: Parser | null = null;
const languageCache = new Map<string, Language>();

function resolveGrammar(extension: string): GrammarSpec | null {
  return EXTENSION_TO_GRAMMAR[extension.toLowerCase()] ?? null;
}

async function ensureParserInitialized(): Promise<Parser> {
  if (!parserInitPromise) {
    parserInitPromise = Parser.init({
      locateFile(scriptName: string) {
        if (scriptName.endsWith(".wasm")) {
          return RUNTIME_WASM_PATH;
        }

        return scriptName;
      },
    });
  }

  await parserInitPromise;

  if (!sharedParser) {
    sharedParser = new Parser();
  }

  return sharedParser;
}

async function loadLanguage(grammarFile: string): Promise<Language | null> {
  const cachedLanguage = languageCache.get(grammarFile);

  if (cachedLanguage) {
    return cachedLanguage;
  }

  try {
    const wasmPath = path.join(WASM_DIRECTORY, `tree-sitter-${grammarFile}.wasm`);
    const wasmBytes = await fs.promises.readFile(wasmPath);
    const language = await Language.load(wasmBytes);

    languageCache.set(grammarFile, language);

    return language;
  } catch {
    return null;
  }
}

export async function parseSourceFile(
  file: ParseSourceFileInput,
): Promise<ParseSourceFileResult | null> {
  try {
    const grammar = resolveGrammar(file.extension);

    if (!grammar) {
      return null;
    }

    const parser = await ensureParserInitialized();
    const language = await loadLanguage(grammar.grammarFile);

    if (!language) {
      return null;
    }

    const absolutePath = path.join(getRepositoryDir(file.repositoryId), file.path);
    const sourceText = await fs.promises.readFile(absolutePath, "utf8");

    parser.setLanguage(language);
    const tree = parser.parse(sourceText);

    if (!tree) {
      return null;
    }

    return {
      tree,
      language: grammar.languageName,
      sourceText,
    };
  } catch {
    return null;
  }
}
