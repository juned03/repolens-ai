import {
  ArrowRight,
  Code2,
  FileSearch,
  MessageSquareText,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Upload,
    title: "Repository upload",
    description:
      "Drop a ZIP archive and index your codebase in minutes — no manual setup required.",
  },
  {
    icon: Code2,
    title: "AST-aware parsing",
    description:
      "Tree-sitter chunks code by symbols and structure so retrieval understands context, not just lines.",
  },
  {
    icon: FileSearch,
    title: "Vector search",
    description:
      "Embeddings stored in Qdrant enable fast, filtered semantic search scoped to each repository.",
  },
  {
    icon: MessageSquareText,
    title: "RAG-powered chat",
    description:
      "Ask natural-language questions and get answers grounded in your indexed source files.",
  },
  {
    icon: Sparkles,
    title: "File citations",
    description:
      "Every response links to the exact files and line ranges used to generate the answer.",
  },
  {
    icon: Zap,
    title: "Streaming responses",
    description:
      "Answers stream token-by-token for a responsive chat experience while you explore the code.",
  },
] as const;

export default function MarketingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.97_0_0),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.25_0_0),transparent_55%)]"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge variant="secondary" className="mb-6">
            AI-powered code documentation
          </Badge>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Understand any repository with intelligent, cited answers
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty sm:text-xl">
            RepoLens AI indexes your source code, retrieves the right context,
            and streams documentation-quality responses — with citations you can
            trust.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/upload">
                Upload Repository
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      <section
        id="features"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Built for developers who need clarity, fast
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty">
            A focused toolchain from upload to chat — designed for readable
            architecture and production-inspired engineering practices.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} size="sm" className="h-full">
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <feature.icon className="size-4" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Ready to explore your codebase?
          </h2>
          <p className="mt-3 max-w-lg text-muted-foreground">
            Upload a repository and start asking questions with cited,
            streaming answers.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/upload">
              Upload Repository
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>RepoLens AI — Code Documentation Assistant</p>
          <p>Upload · Index · Ask · Cite</p>
        </div>
      </footer>
    </>
  );
}
