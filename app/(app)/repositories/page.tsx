import { PageHeader } from "@/components/page-header";
import { RepoCard } from "@/features/repository/repo-card";
import { RepositoriesEmptyState } from "@/features/repository/repositories-empty-state";
import { getAllRepositories } from "@/server/repositories/repository.repo";

export const dynamic = "force-dynamic";

export default async function RepositoriesPage() {
  const repositories = getAllRepositories();

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6">
      <PageHeader
        title="Repositories"
        description="Browse indexed codebases and open a repository to explore files or start a chat."
      />
      {repositories.length === 0 ? (
        <RepositoriesEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repository) => (
            <RepoCard key={repository.id} repository={repository} />
          ))}
        </div>
      )}
    </div>
  );
}
