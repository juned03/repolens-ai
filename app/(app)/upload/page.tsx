import { PageHeader } from "@/components/page-header";
import { UploadDropzone } from "@/features/upload/upload-dropzone";

export default function UploadPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Upload Repository"
        description="Add a ZIP archive of your source code. RepoLens will parse, chunk, and index it for semantic search and chat."
      />
      <UploadDropzone />
    </div>
  );
}
