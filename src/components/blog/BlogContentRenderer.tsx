import React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

export function BlogContentRenderer({ content, className }: BlogContentRendererProps) {
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let listItems: React.ReactNode[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 ml-2">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      // Code block handling
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          elements.push(
            <pre
              key={`code-${index}`}
              className="bg-muted/50 border border-border/50 rounded-lg p-4 overflow-x-auto mb-4 text-sm font-mono"
            >
              <code className="text-foreground/90">{codeBlockContent.join('\n')}</code>
            </pre>
          );
          inCodeBlock = false;
          codeBlockLang = '';
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Image handling: ![alt](url)
      const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        flushList();
        const [, alt, src] = imageMatch;
        elements.push(
          <figure key={`img-${index}`} className="my-6">
            <img
              src={src}
              alt={alt}
              className="w-full rounded-lg border border-border/30 shadow-lg"
              loading="lazy"
            />
            {alt && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
                {alt}
              </figcaption>
            )}
          </figure>
        );
        return;
      }

      // Horizontal rule
      if (line.trim() === '---' || line.trim() === '***') {
        flushList();
        elements.push(
          <hr key={`hr-${index}`} className="my-6 border-border/50" />
        );
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="text-2xl sm:text-3xl font-bold mt-8 mb-4 text-foreground">
            {parseInlineFormatting(line.slice(2))}
          </h1>
        );
        return;
      }

      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl sm:text-2xl font-bold mt-6 mb-3 text-foreground">
            {parseInlineFormatting(line.slice(3))}
          </h2>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg sm:text-xl font-semibold mt-5 mb-2 text-foreground">
            {parseInlineFormatting(line.slice(4))}
          </h3>
        );
        return;
      }

      if (line.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={`h4-${index}`} className="text-base font-semibold mt-4 mb-2 text-foreground">
            {parseInlineFormatting(line.slice(5))}
          </h4>
        );
        return;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote
            key={`quote-${index}`}
            className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-lg italic text-muted-foreground"
          >
            {parseInlineFormatting(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Unordered list
      if (line.match(/^[-*] /)) {
        inList = true;
        listItems.push(
          <li key={`li-${index}`} className="text-foreground/90">
            {parseInlineFormatting(line.slice(2))}
          </li>
        );
        return;
      }

      // Numbered list
      if (line.match(/^\d+\. /)) {
        flushList();
        const content = line.replace(/^\d+\. /, '');
        elements.push(
          <div key={`ol-${index}`} className="flex gap-2 mb-2 ml-2">
            <span className="text-primary font-medium">{line.match(/^\d+/)?.[0]}.</span>
            <span className="text-foreground/90">{parseInlineFormatting(content)}</span>
          </div>
        );
        return;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${index}`} className="mb-4 text-foreground/90 leading-relaxed">
          {parseInlineFormatting(line)}
        </p>
      );
    });

    // Flush any remaining list items
    flushList();

    return elements;
  };

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      {renderContent()}
    </div>
  );
}

// Parse inline formatting: **bold**, *italic*, `code`, [link](url)
function parseInlineFormatting(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      elements.push(
        <strong key={`bold-${keyIndex++}`} className="font-bold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      elements.push(
        <em key={`italic-${keyIndex++}`} className="italic">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      elements.push(
        <code
          key={`code-${keyIndex++}`}
          className="bg-muted/70 px-1.5 py-0.5 rounded text-sm font-mono text-primary"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      elements.push(
        <a
          key={`link-${keyIndex++}`}
          href={DOMPurify.sanitize(linkMatch[2])}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular character - find next special character or end
    const nextSpecial = remaining.search(/\*|`|\[/);
    if (nextSpecial === -1) {
      elements.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Special character but didn't match patterns - treat as regular text
      elements.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      elements.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return elements.length === 1 ? elements[0] : elements;
}
