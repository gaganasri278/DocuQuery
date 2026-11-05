import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse blocks (code blocks, tables, blockquotes, lists, paragraphs)
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let blockIndex = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code Block (```lang ... ```)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const codeText = codeLines.join('\n');
        const curIdx = blockIndex++;

        elements.push(
          <div key={`code-${curIdx}`} className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 text-slate-100 shadow-md">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 uppercase font-semibold text-[11px] text-indigo-400">
                <Terminal className="w-3.5 h-3.5" />
                {lang}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(codeText, curIdx)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Copy code to clipboard"
              >
                {copiedIndex === curIdx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed scrollbar-thin">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Markdown Table (| ... | ... |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const parseRow = (rowStr: string) =>
            rowStr
              .slice(1, -1)
              .split('|')
              .map(col => col.trim());

          const headerCols = parseRow(tableLines[0]);
          // check if row 1 is separator (---)
          const isSeparator = tableLines[1].replace(/[\s|:-]/g, '').length === 0;
          const bodyRows = tableLines.slice(isSeparator ? 2 : 1).map(parseRow);

          elements.push(
            <div key={`table-${blockIndex++}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    {headerCols.map((col, idx) => (
                      <th key={idx} className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-700">
                        {renderInline(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-slate-600 dark:text-slate-300">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Headers (#, ##, ###)
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${blockIndex++}`} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
            {renderInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${blockIndex++}`} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5">
            {renderInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${blockIndex++}`} className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">
            {renderInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }

      // Blockquotes (> ...)
      if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <blockquote key={`quote-${blockIndex++}`} className="my-2 pl-3 py-1 border-l-4 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-700 dark:text-slate-300 rounded-r text-xs italic">
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx}>{renderInline(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Bullet Lists (- or * or numbered 1.)
      if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        const listItems: { text: string; isOrdered: boolean }[] = [];
        while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || /^\d+\.\s+/.test(lines[i]))) {
          const cur = lines[i];
          const isOrd = /^\d+\.\s+/.test(cur);
          const txt = isOrd ? cur.replace(/^\d+\.\s+/, '') : cur.replace(/^[-*]\s+/, '');
          listItems.push({ text: txt, isOrdered: isOrd });
          i++;
        }
        const isOrdered = listItems[0].isOrdered;
        if (isOrdered) {
          elements.push(
            <ol key={`ol-${blockIndex++}`} className="my-2 list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {renderInline(item.text)}
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${blockIndex++}`} className="my-2 list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {renderInline(item.text)}
                </li>
              ))}
            </ul>
          );
        }
        continue;
      }

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Standard paragraph
      elements.push(
        <p key={`p-${blockIndex++}`} className="my-1.5 leading-relaxed text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Helper to parse inline tokens: bold **...**, italics *...*, code `...`, math $...$, links [...](...)
  const renderInline = (text: string): React.ReactNode => {
    // Regex matches inline code `...`, bold **...**, italics *...*, math $...$, links [text](url)
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Inline code
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-xs bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-semibold text-slate-900 dark:text-white">
            {renderInline(part.slice(2, -2))}
          </strong>
        );
      }

      // Italics
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={index} className="italic text-slate-800 dark:text-slate-300">
            {renderInline(part.slice(1, -1))}
          </em>
        );
      }

      // LaTeX Math ($...$)
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        return (
          <span
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded font-mono text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
            title="Math Equation"
          >
            {part.slice(1, -1)}
          </span>
        );
      }

      // Markdown links [text](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            {linkMatch[1]}
            <ExternalLink className="w-3 h-3 ml-0.5 inline" />
          </a>
        );
      }

      return part;
    });
  };

  return <div className="space-y-1">{renderBlocks()}</div>;
};
