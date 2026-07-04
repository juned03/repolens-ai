import { PageHeader } from "@/components/page-header";
import { ChatPanel } from "@/features/chat/chat-panel";

interface ChatPageProps {
  params: Promise<{ repoId: string }>;
}

export default async function RepositoryChatPage({ params }: ChatPageProps) {
  const { repoId } = await params;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <PageHeader
        title="Chat"
        description="Ask questions about this repository. Answers are generated from the indexed source code."
      />
      <ChatPanel repositoryId={repoId} />
    </div>
  );
}
