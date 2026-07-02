import { FolderGit2, Upload } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function RepositoriesEmptyState() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-16 text-center sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.97_0_0),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(0.25_0_0),transparent_70%)]"
      />

      <div className="relative mb-8">
        <div
          aria-hidden
          className="absolute -inset-6 rounded-full bg-primary/10 blur-2xl"
        />
        <div className="relative flex size-28 items-center justify-center rounded-3xl bg-background shadow-sm ring-1 ring-border">
          <FolderGit2
            className="size-14 text-muted-foreground"
            strokeWidth={1.25}
          />
        </div>
      </div>

      <h2 className="relative text-xl font-medium tracking-tight">
        No repositories yet.
      </h2>

      <p className="relative mt-2 max-w-sm text-sm text-muted-foreground">
        Upload your first codebase to start exploring it with AI-powered
        documentation and cited answers.
      </p>

      <Button asChild size="lg" className="relative mt-8">
        <Link href="/upload">
          <Upload />
          Upload Repository
        </Link>
      </Button>

      <p className="relative mt-8 max-w-lg text-xs leading-relaxed text-muted-foreground">
        RepoLens AI indexes your source files, retrieves relevant context with
        vector search, and streams documentation-quality responses — each answer
        linked to the exact files and line ranges it used.
      </p>
    </div>
  );
}
