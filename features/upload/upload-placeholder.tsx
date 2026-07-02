import { FileArchive, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

export function UploadPlaceholder() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div
        aria-label="ZIP upload area — functionality coming in a future milestone"
        className="flex min-h-80 flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-6 py-16 text-center"
      >
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
          <FileArchive
            className="size-10 text-muted-foreground"
            strokeWidth={1.25}
          />
        </div>

        <p className="text-base font-medium">
          Drag and drop your repository ZIP here
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          ZIP archives containing source code are supported. Dependencies and
          build artifacts are ignored during indexing.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Upload functionality will be implemented in the next milestone.
        </p>
        <Button disabled className="shrink-0">
          <Upload />
          Upload Repository
        </Button>
      </div>
    </div>
  );
}
