import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Sparkles,
  BookOpen,
  ListOrdered,
  HelpCircle,
  Copy,
  Check,
  Loader2,
  GitCompare,
  ArrowRight
} from 'lucide-react';
import { DocumentItem, DocumentSummary, DocumentCompareResult } from '../types';
import { api } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

interface DocumentIntelligenceModalProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  allDocuments: DocumentItem[];
}

export const DocumentIntelligenceModal: React.FC<DocumentIntelligenceModalProps> = ({
  documentId,
  isOpen,
  onClose,
  allDocuments
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'key_points' | 'definitions' | 'revision' | 'compare'>('summary');
  const [summaryData, setSummaryData] = useState<DocumentSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Compare mode state
  const [compareDocId, setCompareDocId] = useState<string>('');
  const [compareResult, setCompareResult] = useState<DocumentCompareResult | null>(null);
  const [comparing, setComparing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && documentId) {
      loadIntelligence(documentId);
      // Select another document for compare if available
      const other = allDocuments.find(d => d.id !== documentId);
      if (other) setCompareDocId(other.id);
    } else {
      setSummaryData(null);
      setCompareResult(null);
    }
  }, [isOpen, documentId]);

  const loadIntelligence = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.summarizeDocument(id);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load document intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!documentId || !compareDocId) return;
    setComparing(true);
    try {
      const res = await api.compareDocuments([documentId, compareDocId]);
      setCompareResult(res);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setComparing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                Document Intelligence: {summaryData?.filename || 'Analyzing...'}
              </h2>
              <span className="text-xs text-slate-400">
                Executive Synthesis • Key Points • Definitions • Revision Notes
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Summary</span>
          </button>
          <button
            onClick={() => setActiveTab('key_points')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'key_points'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Key Takeaways</span>
          </button>
          <button
            onClick={() => setActiveTab('definitions')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'definitions'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Definitions & Terms</span>
          </button>
          <button
            onClick={() => setActiveTab('revision')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'revision'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Revision Notes</span>
          </button>
          {allDocuments.length > 1 && (
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Multi-Document Comparison</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Synthesizing document intelligence with Gemini AI...</span>
            </div>
          ) : (
            <>
              {/* Tab: Summary */}
              {activeTab === 'summary' && summaryData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Comprehensive Executive Summary
                    </h3>
                    <button
                      onClick={() => handleCopy(summaryData.summary)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">
                    {summaryData.summary}
                  </div>
                </div>
              )}

              {/* Tab: Key Points */}
              {activeTab === 'key_points' && summaryData && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    High-Yield Key Takeaways
                  </h3>
                  <div className="space-y-2.5">
                    {summaryData.key_points.map((pt, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850/50 flex items-start gap-3 shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Definitions */}
              {activeTab === 'definitions' && summaryData && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Terminology & Key Definitions Glossary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summaryData.definitions.map((def, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850/50 space-y-1 shadow-2xs"
                      >
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs block">
                          {def.term}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          {def.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Revision Notes */}
              {activeTab === 'revision' && summaryData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Structured Revision & Review Notes
                    </h3>
                    <button
                      onClick={() => handleCopy(summaryData.revision_notes)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <MarkdownRenderer content={summaryData.revision_notes} />
                  </div>
                </div>
              )}

              {/* Tab: Compare */}
              {activeTab === 'compare' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Compare with:</span>
                      <select
                        value={compareDocId}
                        onChange={(e) => setCompareDocId(e.target.value)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        {allDocuments.filter(d => d.id !== documentId).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.filename}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleCompare}
                      disabled={comparing || !compareDocId}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5 shadow-sm"
                    >
                      {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
                      <span>Execute Comparison</span>
                    </button>
                  </div>

                  {compareResult && (
                    <div className="space-y-4">
                      {/* Synthesis */}
                      <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="font-bold text-xs uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                          Executive Comparative Synthesis
                        </span>
                        <p className="leading-relaxed">{compareResult.synthesis}</p>
                      </div>

                      {/* Similarities & Differences */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                          <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                            Key Similarities
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                            {compareResult.key_similarities.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                          <span className="font-bold text-xs text-blue-800 dark:text-blue-300">
                            Key Differences
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-xs text-blue-900 dark:text-blue-200">
                            {compareResult.key_differences.map((d, idx) => (
                              <li key={idx}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
