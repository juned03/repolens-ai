"use client";

import { memo } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import type { Components } from "react-markdown";

interface MarkdownMessageProps {
  content: string;
}

function extractLanguage(className: string | undefined): string | null {
  const match = className?.match(/language-(\w+)/);
  return match ? match[1] : null;
}

const markdownComponents: Components = {
  pre({ children }) {
    return <>{children}</>;
  },

  code({ className, children, ...rest }) {
    const language = extractLanguage(className);
    const codeString = String(children).replace(/\n$/, "");

    if (!language) {
      return (
        <code
          className="rounded bg-black/10 px-1.5 py-0.5 text-[0.85em] dark:bg-white/10"
          {...rest}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="my-3 overflow-hidden rounded-lg">
        <div className="flex items-center justify-between bg-zinc-800 px-4 py-1.5 text-xs text-zinc-400">
          <span>{language}</span>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: "0.825rem",
            lineHeight: 1.6,
          }}
          codeTagProps={{
            style: { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  },

  p({ children }) {
    return <p className="mb-2 last:mb-0">{children}</p>;
  },

  h1({ children }) {
    return <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h1>;
  },

  h2({ children }) {
    return <h2 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h2>;
  },

  h3({ children }) {
    return <h3 className="mb-1.5 mt-2.5 text-sm font-bold first:mt-0">{children}</h3>;
  },

  ul({ children }) {
    return <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>;
  },

  ol({ children }) {
    return <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>;
  },

  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },

  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-primary"
      >
        {children}
      </a>
    );
  },

  blockquote({ children }) {
    return (
      <blockquote className="mb-2 border-l-2 border-border pl-3 italic text-muted-foreground last:mb-0">
        {children}
      </blockquote>
    );
  },

  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },

  th({ children }) {
    return (
      <th className="border border-border bg-muted/50 px-3 py-1.5 text-left font-medium">
        {children}
      </th>
    );
  },

  td({ children }) {
    return <td className="border border-border px-3 py-1.5">{children}</td>;
  },

  hr() {
    return <hr className="my-3 border-border" />;
  },
};

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
}: MarkdownMessageProps) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </Markdown>
  );
});
