import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Copy, Check, Loader2, BookOpen } from 'lucide-react';
import { DocumentPreview } from '../types';
import { api } from '../services/api';

interface DocumentPreviewModalProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  documentId,
  isOpen,
  onClose,
}) => {
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && documentId) {
      loadPreview(documentId);
    } else {
      setPreview(null);
      setSearchQuery('');
    }
  }, [isOpen, documentId]);

  const loadPreview = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getDocumentPreview(id);
      setPreview(data);
    } catch (err) {
      console.error('Failed to load document preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!preview) return;
    navigator.clipboard.writeText(preview.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Filter content paragraphs if search query is provided
  const paragraphs = preview?.content ? preview.content.split('\n\n') : [];
  const filteredParagraphs = searchQuery.trim()
    ? paragraphs.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
    : paragraphs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                {preview?.filename || 'Document Preview'}
              </h2>
              <span className="text-xs text-slate-400">
                {preview ? `${preview.total_pages} Pages • ${preview.total_chunks} Semantic Vector Chunks` : 'Loading details...'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {preview && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                title="Copy entire document text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search within document bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords or passages within this document..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              {filteredParagraphs.length} matching sections
            </span>
          )}
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Retrieving document content from index...</span>
            </div>
          ) : filteredParagraphs.length > 0 ? (
            filteredParagraphs.map((para, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-850/40 hover:border-slate-200 dark:hover:border-slate-700 transition"
              >
                <div className="whitespace-pre-wrap">{para}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              No content matched your search keyword "{searchQuery}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
