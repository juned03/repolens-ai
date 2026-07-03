"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  UPLOAD_FIELD_NAME,
  validateZipFile,
} from "@/lib/upload-validation";
import type { UploadResponse } from "@/types/repository";

interface UseUploadResult {
  upload: (file: File) => Promise<boolean>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useUpload(): UseUploadResult {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      const validationError = validateZipFile(file);

      if (validationError) {
        setError(validationError);
        return false;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append(UPLOAD_FIELD_NAME, file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as UploadResponse & {
          error?: string;
        };

        if (!response.ok) {
          setError(data.error ?? "Upload failed. Please try again.");
          return false;
        }

        router.push("/repositories");
        router.refresh();
        return true;
      } catch {
        setError("Upload failed. Please try again.");
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [router],
  );

  return { upload, isUploading, error, clearError };
}
