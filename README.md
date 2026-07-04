# RepoLens AI

An AI-powered Code Documentation Assistant that lets you upload a source code repository, automatically indexes it with semantic understanding, and answers natural-language questions about the codebase — with every answer grounded in the actual source code and cited back to specific files and line ranges.

Built as part of an AI Full Stack Engineering assignment.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)
- [RAG Design Decisions](#rag-design-decisions)
- [Engineering Decisions](#engineering-decisions)
- [Production Improvements](#production-improvements)
- [Testing](#testing)
- [Future Improvements](#future-improvements)
- [Screenshots](#screenshots)
- [License](#license)

---

## Features

- **Repository Upload** — Upload ZIP archives of source code through a drag-and-drop interface
- **Automatic Indexing** — Full pipeline runs on upload: extraction, parsing, chunking, embedding, and vector indexing
- **Tree-sitter Parsing** — Language-aware AST parsing for 20+ languages using WebAssembly grammars
- **Semantic + Gap-Aware Chunking** — Extracts meaningful code blocks (functions, classes, interfaces) as chunks, then fills gaps to capture top-level statements like `connectDB()` or `app.use()`
- **Embedding Generation** — Batched embedding generation using OpenAI `text-embedding-3-small`
- **Vector Search** — Cosine similarity search over Qdrant with repository-scoped filtering
- **Hybrid Retrieval** — Combines vector similarity with keyword boosting for precise results
- **Conversational AI Chat** — Streaming chat interface powered by GPT-4o-mini with strict grounding rules
- **Markdown Responses** — Assistant messages rendered as rich Markdown with syntax-highlighted code blocks
- **Repository Management** — List, browse, and delete repositories with full cleanup (metadata, files, vectors)
- **Dark Mode** — Full dark mode support across the entire UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| LLM | OpenAI GPT-4o-mini |
| Embedding Model | OpenAI text-embedding-3-small (1536 dimensions) |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/openai`) |
| Vector Database | Qdrant |
| Metadata Database | SQLite (better-sqlite3), Drizzle ORM |
| Code Parsing | Tree-sitter (web-tree-sitter + tree-sitter-wasms) |
| ZIP Handling | yauzl |
| Validation | Zod |
| Markdown | react-markdown, remark-gfm, react-syntax-highlighter |
| UI Components | shadcn/ui, Lucide React |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Upload (ZIP)                        │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ Extraction │  yauzl, Zip Slip guard │
│                    └─────┬─────┘                         │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ Discovery  │  Recursive walk,       │
│                    │            │  file filtering         │
│                    └─────┬─────┘                         │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ Parsing    │  Tree-sitter AST        │
│                    │            │  (20+ languages)        │
│                    └─────┬─────┘                         │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ Chunking   │  Semantic nodes         │
│                    │            │  + gap filling          │
│                    └─────┬─────┘                         │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ Embedding  │  text-embedding-3-small │
│                    │            │  (batched, 64/batch)    │
│                    └─────┬─────┘                         │
│                          │                               │
│                    ┌─────▼─────┐                         │
│                    │ Indexing   │  Qdrant upsert          │
│                    │            │  (deterministic IDs)    │
│                    └─────┬─────┘                         │
│                          │                               │
│               ┌──────────▼──────────┐                    │
│               │    Qdrant Vector DB  │                   │
│               └──────────┬──────────┘                    │
│                          │                               │
│              ┌───────────▼───────────┐                   │
│              │ Retrieval (Hybrid)     │                   │
│              │ Vector + Keyword Boost │                   │
│              └───────────┬───────────┘                   │
│                          │                               │
│              ┌───────────▼───────────┐                   │
│              │  Prompt Construction   │                   │
│              │  (Context + Question)  │                   │
│              └───────────┬───────────┘                   │
│                          │                               │
│              ┌───────────▼───────────┐                   │
│              │   GPT-4o-mini (LLM)    │                   │
│              │   Streaming Response   │                   │
│              └───────────┬───────────┘                   │
│                          │                               │
│              ┌───────────▼───────────┐                   │
│              │   Chat UI (Markdown)   │                   │
│              │   Syntax Highlighting  │                   │
│              └───────────────────────┘                   │
└──────────────────────────────────────────────────────────┘
```

**Dependency flow:**

```
UI → API Routes → Services → Repositories → Database / External Clients
```

Business logic never lives in route handlers. API routes only validate, delegate to services, and return responses.

---

## Project Structure

```
repolens-ai/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated app layout
│   │   ├── repositories/         # Repository list + detail + chat pages
│   │   └── upload/               # Upload page
│   ├── (marketing)/              # Landing page
│   └── api/                      # API route handlers
│       ├── upload/               # POST /api/upload
│       └── repositories/         # CRUD + chat endpoints
├── components/                   # Shared UI components
│   ├── layout/                   # App shell, sidebar, header
│   └── ui/                       # shadcn/ui primitives
├── features/                     # Feature-specific UI
│   ├── chat/                     # Chat panel, message list, markdown renderer
│   ├── repository/               # Repo card, delete button, empty state
│   └── upload/                   # Upload dropzone, progress
├── server/
│   ├── clients/                  # External service clients (Qdrant)
│   ├── db/                       # SQLite schema + Drizzle client
│   ├── repositories/             # Data access layer (SQLite queries)
│   └── services/                 # Business logic
│       ├── chat/                 # RAG service, prompt builder
│       ├── embedding/            # OpenAI embedding generation
│       ├── ingestion/            # ZIP extraction, file filtering, file store
│       ├── parsing/              # Tree-sitter, chunk generation, file discovery
│       ├── repository/           # Repository lifecycle (deletion)
│       ├── retrieval/            # Hybrid vector + keyword search
│       ├── upload/               # Upload orchestration
│       └── vector/               # Qdrant indexing
├── config/                       # Application configuration (env, ingestion)
├── lib/                          # Pure utility functions
├── types/                        # Shared TypeScript types
├── scripts/                      # Developer verification scripts
├── data/                         # SQLite DB + extracted repositories
└── docker-compose.yml            # Qdrant container
```

---

## Installation

### Prerequisites

- Node.js 20+
- Docker (for Qdrant)
- OpenAI API key

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/repolens-ai.git
cd repolens-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start Qdrant
docker compose up -d

# Run database migrations
npx drizzle-kit push

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the project root:

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for embeddings and chat |
| `QDRANT_URL` | No | `http://localhost:6333` | Qdrant vector database URL |
| `DATABASE_URL` | No | `./data/repolens.db` | SQLite database file path |
| `DATA_DIR` | No | `./data` | Directory for extracted repository files |
| `MAX_UPLOAD_SIZE_MB` | No | `50` | Maximum ZIP upload size in megabytes |
| `MAX_FILES_PER_REPO` | No | `500` | Maximum number of files per repository |

---

## How It Works

### 1. Repository Upload

The user uploads a ZIP archive through a drag-and-drop interface. The file is validated (size, MIME type, extension) and streamed into a buffer.

### 2. Extraction

The ZIP is extracted using `yauzl` with streaming. Every entry path is validated against Zip Slip attacks. Files in `node_modules`, `.git`, `dist`, `build`, `coverage`, and `__MACOSX` directories are skipped. Lockfiles and `.gitignore` are excluded.

### 3. Discovery

A recursive filesystem walk discovers all supported source files. Each file's path, extension, and size are collected. macOS metadata files (`._*`) are filtered out.

### 4. Tree-sitter Parsing

Each discovered file is parsed into an Abstract Syntax Tree using language-specific Tree-sitter WASM grammars. The parser supports TypeScript, JavaScript, Python, Go, Rust, Java, C/C++, Ruby, PHP, and more. Files without a matching grammar gracefully fall back to line-based processing.

### 5. Chunking

Parsed ASTs are split into **semantic chunks** — functions, classes, interfaces, type declarations, and other meaningful code blocks. A **gap-filling** pass then identifies lines between semantic nodes (imports, bare function calls, middleware registrations) and creates additional chunks so no source line is lost.

Files without ASTs use a line-based chunking strategy with configurable window size and overlap.

### 6. Embedding

Chunks are batched (64 per batch) and sent to OpenAI's `text-embedding-3-small` model, producing 1536-dimensional vectors.

### 7. Indexing

Vectors are upserted into a Qdrant collection with deterministic UUID v5 point IDs (derived from `repositoryId + filePath + chunkIndex`). Before upserting, all existing vectors for the repository are deleted to prevent stale data.

### 8. Retrieval

When the user asks a question, the system:
1. Extracts significant keywords from the query (filtering stop words)
2. Embeds the question using the same embedding model
3. Searches Qdrant for the top 24 candidates (3x over-fetch), filtered by repository ID
4. Scores each candidate: `vectorScore + 0.15 × keywordMatchRatio`
5. Returns the top 8 chunks by combined score

### 9. Prompt Construction

Retrieved chunks are formatted into numbered context blocks with file paths, languages, and line ranges. The system prompt enforces strict grounding rules: the model must answer only from provided context, cite file paths, and explicitly state when information is not present.

### 10. Streaming Response

The response streams from GPT-4o-mini through the Vercel AI SDK's `streamText` API, through a Next.js API route, to the frontend where it's rendered as Markdown with syntax-highlighted code blocks in real time.

---

## RAG Design Decisions

### Why Tree-sitter?

Tree-sitter provides language-aware parsing that understands code structure, not just line boundaries. This means a function definition is always kept as a single chunk regardless of its length, preserving semantic coherence that naive line splitting would break.

### Why Semantic Chunking?

Splitting by AST nodes (functions, classes, interfaces) produces chunks that are semantically self-contained. When a user asks "How does the authentication middleware work?", the retriever returns the complete middleware function, not a fragment that starts mid-function.

### Why Gap-Aware Chunking?

Pure semantic chunking misses "glue code" — top-level statements like `connectDB()`, `dotenv.config()`, `app.use(express.json())`, and `app.listen()`. These lines fall between semantic nodes and would be lost entirely. Gap chunks capture every uncovered line range, ensuring full file coverage.

### Why Qdrant?

Qdrant provides filtered vector search (scoping results to a single repository), payload storage (keeping chunk content alongside vectors), and efficient cosine similarity — all needed for multi-repository RAG without cross-contamination.

### Why Hybrid Retrieval with Keyword Boosting?

Pure vector search sometimes ranks semantically related but wrong chunks above exact matches. When a user asks "Where is connectDB called?", vector similarity might rank the function definition higher than the call site. Keyword boosting adds a small score bonus (0.15 weight) for chunks containing exact query terms, re-ranking near-ties without overriding strong semantic matches.

### Why OpenAI Embeddings?

`text-embedding-3-small` provides a good balance of quality, cost, and dimension size (1536). It's the same model family as the LLM, ensuring consistent semantic understanding between embedding and generation.

### Context Assembly

Retrieved chunks are formatted as numbered blocks with full metadata:

```
[1] backend/index.js (javascript, lines 17-19)
connectDB();
```

This format gives the LLM both the code and its location, enabling accurate citations in responses.

---

## Engineering Decisions

- **Architecture enforcement** — Strict `UI → API Routes → Services → Repositories → DB/Clients` dependency flow. Business logic never leaks into route handlers.
- **Deterministic vector IDs** — UUID v5 from `repositoryId:filePath:chunkIndex` ensures re-indexing overwrites the same points instead of creating duplicates.
- **Delete-before-upsert** — Repository re-indexing deletes all existing vectors first, preventing stale chunks from files that were removed or renamed.
- **Lazy Tree-sitter loading** — WASM grammars and the parser are loaded dynamically at runtime to avoid Turbopack bundling issues with WebAssembly modules.
- **Graceful degradation** — Files without Tree-sitter grammars fall back to line-based chunking. Qdrant cleanup failures during deletion are logged but don't block metadata removal.
- **Streaming architecture** — The AI SDK's `streamText` pipes directly to the HTTP response, minimizing memory usage and time-to-first-token.
- **Input validation** — Every API route validates input with Zod schemas before touching business logic.

---

## Production Improvements

This is a take-home assignment scoped for demonstration. In a production system, the following would be added:

- **Authentication & Authorization** — User accounts, API keys, repository ownership and access control
- **Background Job Queue** — Move the indexing pipeline (parsing, embedding, Qdrant upsert) to a background worker (e.g. BullMQ, Inngest) so uploads return immediately
- **Async Indexing with Progress** — WebSocket or SSE-based progress updates during indexing, with status polling from the client
- **Caching** — Cache embedding results for unchanged files, cache frequent retrieval queries
- **Observability** — Structured logging, distributed tracing (OpenTelemetry), error tracking (Sentry)
- **Monitoring** — Qdrant health checks, embedding latency metrics, LLM token usage dashboards
- **Rate Limiting** — Per-user rate limits on chat and upload endpoints
- **Retry Logic** — Exponential backoff for OpenAI and Qdrant API calls
- **Horizontal Scaling** — Stateless API servers behind a load balancer, with shared Qdrant and PostgreSQL (replacing SQLite)
- **Vector DB Sharding** — Qdrant collection sharding for repositories with millions of chunks
- **File-Level Incremental Indexing** — Only re-embed files that changed (based on content hash)
- **Conversation History** — Persist chat sessions and support multi-turn context

---

## Testing

The project includes developer verification scripts for each pipeline stage:

```bash
# Test file discovery, parsing, and chunk generation
npm run test:chunking -- <repositoryId>

# Test embedding generation
npm run test:embeddings -- <repositoryId>

# Test full Qdrant indexing pipeline
npm run test:qdrant -- <repositoryId>

# Test semantic retrieval
npm run test:retrieval -- <repositoryId> "your question"

# Test RAG answer generation
npm run test:rag -- <repositoryId> "your question"
```

Each script runs the pipeline up to its stage and prints diagnostic output (counts, scores, content previews) for manual verification.

---

## Future Improvements

- [ ] Multi-turn conversation history with session persistence
- [ ] File explorer with syntax-highlighted source viewer
- [ ] Citation links in chat responses that jump to specific file lines
- [ ] Incremental re-indexing (only re-embed changed files)
- [ ] Support for private Git repository URLs (clone + index)
- [ ] Configurable chunking strategies per language
- [ ] Multiple embedding model support
- [ ] Conversation export (Markdown, PDF)
- [ ] Repository comparison (diff-aware Q&A)
- [ ] Admin dashboard with usage analytics

---

## Screenshots

> Screenshots will be added here.

| View | Screenshot |
|---|---|
| Landing Page | *Coming soon* |
| Upload | *Coming soon* |
| Repository List | *Coming soon* |
| Chat Interface | *Coming soon* |
| Markdown Response | *Coming soon* |
| Dark Mode | *Coming soon* |

---

## License

This project is licensed under the [MIT License](LICENSE).
