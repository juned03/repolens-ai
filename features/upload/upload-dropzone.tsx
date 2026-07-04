"use client";

import { FileArchive, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_MAX_UPLOAD_SIZE_MB } from "@/lib/upload-validation";
import { cn } from "@/lib/utils";

import { useUpload } from "./use-upload";

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { upload, isUploading, error, clearError } = useUpload();

  const processFile = useCallback(
    async (file: File) => {
      clearError();
      setSelectedFile(file);
      await upload(file);
    },
    [clearError, upload],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!isUploading) {
        setIsDragging(true);
      }
    },
    [isUploading],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (isUploading) {
        return;
      }

      const file = event.dataTransfer.files[0];

      if (file) {
        void processFile(file);
      }
    },
    [isUploading, processFile],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        void processFile(file);
      }

      event.target.value = "";
    },
    [processFile],
  );

  const openFilePicker = useCallback(() => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  }, [isUploading]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div
        role="button"
        tabIndex={0}
        aria-label="ZIP upload area"
        aria-busy={isUploading}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 bg-muted/20",
          isUploading && "pointer-events-none opacity-70",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          className="sr-only"
          onChange={handleInputChange}
          disabled={isUploading}
        />

        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
          {isUploading ? (
            <Loader2
              className="size-10 animate-spin text-muted-foreground"
              strokeWidth={1.25}
            />
          ) : (
            <FileArchive
              className="size-10 text-muted-foreground"
              strokeWidth={1.25}
            />
          )}
        </div>

        <p className="text-base font-medium">
          {isUploading
            ? "Processing repository..."
            : "Drag and drop your repository ZIP here"}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {isUploading
            ? "Extracting, parsing, and indexing your code. You will be redirected to chat when ready."
            : "Or click to browse. ZIP archives up to " +
              `${DEFAULT_MAX_UPLOAD_SIZE_MB} MB are supported.`}
        </p>

        {selectedFile && !isUploading ? (
          <p className="mt-4 text-sm font-medium">{selectedFile.name}</p>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Only .zip files are accepted. Your repository will be indexed
          automatically.
        </p>
        <Button
          type="button"
          className="shrink-0"
          disabled={isUploading}
          onClick={openFilePicker}
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload />
              Choose ZIP File
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
