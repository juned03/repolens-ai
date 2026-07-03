import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Repository, RepositoryStatus } from "@/server/db/schema";

interface RepoCardProps {
  repository: Pick<
    Repository,
    "id" | "name" | "status" | "fileCount" | "chunkCount" | "createdAt"
  >;
}

function statusBadgeVariant(
  status: RepositoryStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ready":
      return "default";
    case "failed":
      return "destructive";
    case "pending":
      return "outline";
    default:
      return "secondary";
  }
}

function formatStatus(status: RepositoryStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatCreatedDate(createdAt: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    createdAt,
  );
}

export function RepoCard({ repository }: RepoCardProps) {
  return (
    <Link
      href={`/repositories/${repository.id}`}
      className="block rounded-xl transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2">{repository.name}</CardTitle>
            <Badge variant={statusBadgeVariant(repository.status)}>
              {formatStatus(repository.status)}
            </Badge>
          </div>
          <CardDescription>
            Created {formatCreatedDate(repository.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Files</dt>
              <dd className="font-medium tabular-nums">
                {repository.fileCount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Chunks</dt>
              <dd className="font-medium tabular-nums">
                {repository.chunkCount.toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
