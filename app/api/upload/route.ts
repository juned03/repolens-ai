import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/config/env";
import {
  ALLOWED_ZIP_MIME_TYPES,
  isZipFileName,
  UPLOAD_FIELD_NAME,
} from "@/lib/upload-validation";
import { startUpload } from "@/server/services/upload/upload.service";

const maxUploadSizeBytes = env.maxUploadSizeMb * 1024 * 1024;

const uploadFileSchema = z
  .object({
    fileName: z.string().min(1, "File name is required"),
    mimeType: z.string(),
    sizeBytes: z
      .number()
      .positive("File cannot be empty")
      .max(
        maxUploadSizeBytes,
        `File exceeds maximum size of ${env.maxUploadSizeMb} MB`,
      ),
  })
  .refine((data) => isZipFileName(data.fileName), {
    message: "File must be a .zip archive",
    path: ["fileName"],
  })
  .refine(
    (data) => {
      if (!data.mimeType || data.mimeType === "application/octet-stream") {
        return true;
      }

      return ALLOWED_ZIP_MIME_TYPES.includes(
        data.mimeType as (typeof ALLOWED_ZIP_MIME_TYPES)[number],
      );
    },
    {
      message: "File must be a ZIP archive",
      path: ["mimeType"],
    },
  );

function validationErrorResponse(error: z.ZodError): NextResponse {
  const issue = error.issues[0];
  const message = issue?.message ?? "Invalid upload";
  const status = issue?.path[0] === "sizeBytes" ? 413 : 400;

  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Failed to parse upload form data:", error);
    return NextResponse.json(
      { error: "Invalid multipart form data" },
      { status: 400 },
    );
  }

  const file = formData.get(UPLOAD_FIELD_NAME);

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A ZIP file is required" },
      { status: 400 },
    );
  }

  const validation = uploadFileSchema.safeParse({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  try {
    const repository = startUpload({ fileName: validation.data.fileName });

    return NextResponse.json({
      repositoryId: repository.id,
      repositoryName: repository.name,
      status: repository.status,
    });
  } catch (error) {
    console.error("Failed to start upload:", error);
    return NextResponse.json(
      { error: "Failed to start upload" },
      { status: 500 },
    );
  }
}
