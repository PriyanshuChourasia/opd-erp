import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight markdown renderer for the help-file subset:
 *   - # / ## headings
 *   - "- " bullet lists
 *   - **bold** and `inline code`
 *   - paragraphs separated by blank lines
 * All help files in this repo follow exactly this structure (no links,
 * tables, code fences, or numbered lists), so a small parser is safe.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="rounded-none border border-border/60 bg-muted px-1 py-0.5 font-mono text-[13px] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let key = 0;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${key++}`} className="my-3 space-y-2 pl-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary/60" />
            <span className="min-w-0">{renderInline(item, `li-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={`h1-${key++}`} className="text-2xl font-semibold tracking-tight text-foreground">
          {renderInline(line.slice(2), "h1")}
        </h1>,
      );
    } else if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${key++}`} className="mt-8 flex items-center gap-2 text-base font-semibold text-foreground first:mt-4">
          <span className="size-1.5 rounded-full bg-primary" />
          {renderInline(line.slice(3), "h2")}
        </h2>,
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={`p-${key++}`} className="my-3 text-sm leading-6 text-muted-foreground">
          {renderInline(trimmed, "p")}
        </p>,
      );
    }
  }
  flushList();

  return (
    <div
      className={cn(
        "space-y-3 [&>p:first-child]:mt-0",
        // spacing after headings handled by their own margins
      )}
    >
      {blocks}
    </div>
  );
}
