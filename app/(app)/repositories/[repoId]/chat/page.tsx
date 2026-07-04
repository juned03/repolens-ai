import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/features/chat/chat-panel";

interface ChatPageProps {
  params: Promise<{ repoId: string }>;
}

export default async function RepositoryChatPage({ params }: ChatPageProps) {
  const { repoId } = await params;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
          <Link href="/repositories" aria-label="Back to Repositories">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <PageHeader
          title="Chat"
          description="Ask questions about this repository. Answers are generated from the indexed source code."
        />
      </div>
      <ChatPanel repositoryId={repoId} />
    </div>
  );
}
