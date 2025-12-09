import React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

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
    let tableRows: string[][] = [];
    let inTable = false;
    let calloutType: string | null = null;
    let calloutContent: string[] = [];

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

    const flushTable = () => {
      if (tableRows.length > 0) {
        const [header, ...body] = tableRows;
        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {header.map((cell, i) => (
                    <th key={i} className="px-4 py-3 text-left font-semibold text-foreground border-b border-border">
                      {parseInlineFormatting(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-foreground/90">
                        {parseInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const flushCallout = () => {
      if (calloutType && calloutContent.length > 0) {
        const calloutConfig = {
          info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
          warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400' },
          tip: { icon: Lightbulb, bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400' },
          success: { icon: CheckCircle, bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400' },
        };
        const config = calloutConfig[calloutType as keyof typeof calloutConfig] || calloutConfig.info;
        const Icon = config.icon;

        elements.push(
          <div key={`callout-${elements.length}`} className={cn(
            'my-6 p-4 rounded-lg border flex gap-3',
            config.bg, config.border
          )}>
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.text)} />
            <div className="flex-1 space-y-2">
              {calloutContent.map((line, i) => (
                <p key={i} className="text-sm text-foreground/90">{parseInlineFormatting(line)}</p>
              ))}
            </div>
          </div>
        );
        calloutType = null;
        calloutContent = [];
      }
    };

    lines.forEach((line, index) => {
      // Callout start: :::info, :::warning, :::tip
      const calloutStart = line.match(/^:::(info|warning|tip|success)$/);
      if (calloutStart) {
        flushList();
        flushTable();
        calloutType = calloutStart[1];
        return;
      }

      // Callout end
      if (line.trim() === ':::' && calloutType) {
        flushCallout();
        return;
      }

      // Inside callout
      if (calloutType) {
        calloutContent.push(line);
        return;
      }

      // Table row detection
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        const cells = line.slice(1, -1).split('|');
        // Skip separator row (|---|---|)
        if (cells.every(cell => cell.trim().match(/^[-:]+$/))) {
          return;
        }
        tableRows.push(cells);
        inTable = true;
        return;
      } else if (inTable) {
        flushTable();
      }

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
              {codeBlockLang && (
                <div className="text-xs text-muted-foreground mb-2 pb-2 border-b border-border/30">
                  {codeBlockLang}
                </div>
              )}
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
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
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
          <hr key={`hr-${index}`} className="my-8 border-border/50" />
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

    // Flush any remaining content
    flushList();
    flushTable();
    flushCallout();

    return elements;
  };

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      {renderContent()}
    </div>
  );
}

// Parse inline formatting: **bold**, *italic*, `code`, [link](url), ~~strikethrough~~
function parseInlineFormatting(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      elements.push(
        <del key={`strike-${keyIndex++}`} className="text-muted-foreground">
          {strikeMatch[1]}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

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
    const nextSpecial = remaining.search(/\*|`|\[|~/);
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
