"use client";

import { AlertCircle, ArrowUp } from "lucide-react";
import { type FormEvent, useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MessageList } from "./message-list";
import { useChatStream } from "./use-chat-stream";

interface ChatPanelProps {
  repositoryId: string;
}

export function ChatPanel({ repositoryId }: ChatPanelProps) {
  const { messages, isStreaming, error, sendMessage } =
    useChatStream(repositoryId);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();

      if (!input.trim() || isStreaming) {
        return;
      }

      const question = input;
      setInput("");
      sendMessage(question);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [input, isStreaming, sendMessage],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit(event);
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card">
      <MessageList messages={messages} isStreaming={isStreaming} />

      {error && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t p-4"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask about this repository..."
          disabled={isStreaming}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isStreaming || !input.trim()}
          aria-label="Send message"
        >
          <ArrowUp className="size-4" />
        </Button>
      </form>
    </div>
  );
}
