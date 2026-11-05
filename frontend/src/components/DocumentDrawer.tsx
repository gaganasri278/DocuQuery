import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  File,
  Filter,
  CheckSquare,
  Square,
  X,
  Sparkles,
  RotateCcw,
  Search,
  Eye,
  BookOpen
} from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleDocFilter: (docId: string) => void;
  onSelectAllDocs: () => void;
  onClearDocFilter: () => void;
  onUploadFiles: (files: File[]) => Promise<void>;
  onLoadSamples: () => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onReindexDocument: (docId: string) => Promise<void>;
  onPreviewDocument: (docId: string) => void;
  onOpenIntelligence: (docId: string) => void;
  isUploading: boolean;
}

export const DocumentDrawer: React.FC<DocumentDrawerProps> = ({
  isOpen,
  onClose,
  documents,
  selectedDocIds,
  onToggleDocFilter,
  onSelectAllDocs,
  onClearDocFilter,
  onUploadFiles,
  onLoadSamples,
  onDeleteDocument,
  onReindexDocument,
  onPreviewDocument,
  onOpenIntelligence,
  isUploading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleSampleClick = async () => {
    setLoadingSamples(true);
    try {
      await onLoadSamples();
    } finally {
      setLoadingSamples(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFormatBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">PDF</span>;
      case 'docx':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">DOCX</span>;
      case 'txt':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">TXT</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">FILE</span>;
    }
  };

  const filteredDocs = searchDocQuery.trim()
    ? documents.filter(d => d.filename.toLowerCase().includes(searchDocQuery.toLowerCase()))
    : documents;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
        role="dialog"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
              Document Knowledge Base
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {isUploading ? 'Extracting & Indexing...' : 'Click or drop documents here'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Supports PDF, DOCX, TXT (up to 25MB each)
              </p>
            </div>
          </div>

          {/* Quick Load Sample Documents Button */}
          <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Sample Benchmark Docs
              </span>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                Instantly load PDF contract, DOCX specs & TXT notes.
              </p>
            </div>
            <button
              onClick={handleSampleClick}
              disabled={loadingSamples || isUploading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 shadow-xs flex-shrink-0"
            >
              {loadingSamples ? 'Loading...' : 'Load Samples'}
            </button>
          </div>

          {/* Search Documents Bar */}
          {documents.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                placeholder="Search uploaded documents by name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Document List Header & Filter Controls */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Indexed Documents ({filteredDocs.length})
                </span>
              </div>
              {documents.length > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  {selectedDocIds.length > 0 ? (
                    <button
                      onClick={onClearDocFilter}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Clear scope ({selectedDocIds.length} active)
                    </button>
                  ) : (
                    <button
                      onClick={onSelectAllDocs}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                    >
                      Scope all docs
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Documents List */}
            {filteredDocs.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
                No documents found. Upload a file above to begin.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredDocs.map((doc) => {
                  const isFiltered = selectedDocIds.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col space-y-2.5 ${
                        isFiltered
                          ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between space-x-3">
                        <button
                          onClick={() => onToggleDocFilter(doc.id)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title={isFiltered ? 'Remove from query scope' : 'Filter query to this document'}
                        >
                          {isFiltered ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            {getFormatBadge(doc.file_type)}
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={doc.filename}>
                              {doc.filename}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-400">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{doc.chunk_count} chunks</span>
                            <span>•</span>
                            {doc.status === 'ready' && (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Indexed
                              </span>
                            )}
                            {doc.status === 'processing' && (
                              <span className="text-amber-500 flex items-center gap-0.5">
                                <Loader2 className="w-3 h-3 animate-spin" /> Indexing
                              </span>
                            )}
                            {doc.status === 'failed' && (
                              <span className="text-rose-500 flex items-center gap-0.5" title={doc.error_message || ''}>
                                <AlertTriangle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onReindexDocument(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                            title="Re-extract and re-index document"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete document and remove embeddings"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Action Shortcuts Bar */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => onPreviewDocument(doc.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => onOpenIntelligence(doc.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Intelligence</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between text-xs text-slate-500">
          <span>{documents.reduce((acc, d) => acc + d.chunk_count, 0)} total vector chunks</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
