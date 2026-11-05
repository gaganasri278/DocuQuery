import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  Check,
  Copy,
  RotateCcw,
  Loader2,
  Mail,
  FileCheck2,
  Sliders,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

export const WritingAssistantView: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [activeOp, setActiveOp] = useState<string>('rewrite');
  const [tone, setTone] = useState<string>('professional');
  const [targetLength, setTargetLength] = useState<string>('balanced');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleProcess = async (opToRun?: string) => {
    const op = opToRun || activeOp;
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    setActiveOp(op);
    try {
      const res = await api.processWriting({
        text: inputText.trim(),
        operation: op,
        tone,
        target_length: targetLength
      });
      setOutputText(res.result);
    } catch (err: any) {
      alert(`Writing processing failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReplaceInput = () => {
    if (!outputText) return;
    setInputText(outputText);
    setOutputText('');
  };

  const operations = [
    { id: 'rewrite', label: 'Rewrite & Polish', icon: Sparkles },
    { id: 'grammar', label: 'Fix Grammar & Typos', icon: FileCheck2 },
    { id: 'simplify', label: 'Simplify (Plain English)', icon: PenTool },
    { id: 'summarize', label: 'Summarize Text', icon: Sliders },
    { id: 'email', label: 'Draft Email', icon: Mail },
    { id: 'report', label: 'Executive Report', icon: FileCheck2 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <span>AI Writing Assistant</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Transform paragraphs, fix grammar, draft executive emails, and adapt tone with precision.
            </p>
          </div>

          {/* Tone & Length Selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Tone:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly & Warm</option>
                <option value="academic">Academic & Rigorous</option>
                <option value="technical">Technical</option>
                <option value="persuasive">Persuasive</option>
                <option value="concise">Ultra-Concise</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Length:</span>
              <select
                value={targetLength}
                onChange={(e) => setTargetLength(e.target.value)}
                className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium"
              >
                <option value="concise">Concise</option>
                <option value="balanced">Balanced</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Pills Bar */}
        <div className="flex flex-wrap gap-2">
          {operations.map((op) => {
            const Icon = op.icon;
            const isSelected = activeOp === op.id;
            return (
              <button
                key={op.id}
                onClick={() => handleProcess(op.id)}
                disabled={isLoading || !inputText.trim()}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 border shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-600 shadow-violet-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-violet-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{op.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dual Split Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[480px]">
          {/* Left Pane: Input */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Original Content</span>
              <span>{inputText.split(/\s+/).filter(Boolean).length} words</span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or write your text here to summarize, fix grammar, rewrite in a professional tone, or transform into an email or executive report..."
              className="w-full flex-1 min-h-[300px] resize-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInputText('')}
                disabled={!inputText}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                Clear input
              </button>

              <button
                onClick={() => handleProcess()}
                disabled={isLoading || !inputText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition flex items-center gap-1.5 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Polishing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Execute ({activeOp})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Pane: Polished Result */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider text-[11px]">
                Refined Output
              </span>
              <div className="flex items-center gap-2">
                {outputText && (
                  <span>{outputText.split(/\s+/).filter(Boolean).length} words</span>
                )}
                {outputText && (
                  <button
                    onClick={handleReplaceInput}
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 flex items-center gap-1"
                    title="Send result back to input for further editing"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>Replace Input</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  <span>Transforming text with Gemini AI...</span>
                </div>
              ) : outputText ? (
                <MarkdownRenderer content={outputText} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center py-12 px-4">
                  <PenTool className="w-8 h-8 opacity-40 mb-2" />
                  <p>Your polished writing, summarized report, or drafted email will appear here.</p>
                </div>
              )}
            </div>

            {outputText && (
              <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition flex items-center gap-1.5"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Output</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
