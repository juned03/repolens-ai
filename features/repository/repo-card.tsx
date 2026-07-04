import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Repository, RepositoryStatus } from "@/server/db/schema";

import { DeleteRepositoryButton } from "./delete-repository-button";

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

function shortenId(id: string): string {
  return id.slice(0, 8);
}

export function RepoCard({ repository }: RepoCardProps) {
  const isReady = repository.status === "ready";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2">{repository.name}</CardTitle>
          <Badge variant={statusBadgeVariant(repository.status)}>
            {formatStatus(repository.status)}
          </Badge>
        </div>
        <CardDescription>
          {shortenId(repository.id)} &middot; Created{" "}
          {formatCreatedDate(repository.createdAt)}
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
      <CardFooter className="mt-auto gap-2 pt-0">
        <Button
          asChild
          variant={isReady ? "default" : "secondary"}
          className="flex-1"
          disabled={!isReady}
        >
          <Link
            href={`/repositories/${repository.id}/chat`}
            aria-disabled={!isReady}
            tabIndex={isReady ? undefined : -1}
            className={isReady ? undefined : "pointer-events-none opacity-50"}
          >
            <MessageSquare className="size-4" />
            Open Chat
          </Link>
        </Button>
        <DeleteRepositoryButton
          repositoryId={repository.id}
          repositoryName={repository.name}
        />
      </CardFooter>
    </Card>
  );
}
