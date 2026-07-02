import { PageHeader } from "@/components/page-header";
import { RepositoriesEmptyState } from "@/features/repository/repositories-empty-state";

export default function RepositoriesPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Repositories"
        description="Browse indexed codebases and open a repository to explore files or start a chat."
      />
      <RepositoriesEmptyState />
    </div>
  );
}
