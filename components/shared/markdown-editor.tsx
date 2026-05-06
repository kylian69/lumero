"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

export type DraftAttachment = {
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
};

export function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export function MarkdownToolbar({
  textareaRef,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (val: string) => void;
}) {
  function wrap(before: string, after = before, placeholder = "texte") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const selected = value.slice(start, end) || placeholder;
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    });
  }
  function prefixLines(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const replaced = block
      .split("\n")
      .map((l) => (l.length ? prefix + l : prefix + "élément"))
      .join("\n");
    onChange(value.slice(0, lineStart) + replaced + value.slice(end));
  }
  const btn =
    "h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground";
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-1 py-1">
      <button type="button" className={btn} title="Gras" onClick={() => wrap("**")}>
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" className={btn} title="Italique" onClick={() => wrap("*")}>
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" className={btn} title="Code" onClick={() => wrap("`")}>
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Lien"
        onClick={() => wrap("[", "](https://)", "lien")}
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Liste à puces"
        onClick={() => prefixLines("- ")}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Liste numérotée"
        onClick={() => prefixLines("1. ")}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="Citation"
        onClick={() => prefixLines("> ")}
      >
        <Quote className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
