export const UPLOAD_FIELD_NAME = "file";

export const ALLOWED_ZIP_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
] as const;

export const DEFAULT_MAX_UPLOAD_SIZE_MB = 50;

export function isZipFileName(fileName: string): boolean {
  return /\.zip$/i.test(fileName);
}

function isAllowedZipMimeType(mimeType: string): boolean {
  if (!mimeType) {
    return true;
  }

  if (mimeType === "application/octet-stream") {
    return true;
  }

  return ALLOWED_ZIP_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_ZIP_MIME_TYPES)[number],
  );
}

export function validateZipFile(
  file: Pick<File, "name" | "type" | "size">,
  maxSizeMb: number = DEFAULT_MAX_UPLOAD_SIZE_MB,
): string | null {
  if (!isZipFileName(file.name)) {
    return "File must be a .zip archive";
  }

  if (!isAllowedZipMimeType(file.type)) {
    return "File must be a ZIP archive";
  }

  if (file.size === 0) {
    return "File cannot be empty";
  }

  const maxBytes = maxSizeMb * 1024 * 1024;

  if (file.size > maxBytes) {
    return `File exceeds maximum size of ${maxSizeMb} MB`;
  }

  return null;
}
