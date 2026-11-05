import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Bookmark,
  Sparkles,
  Loader2,
  Trash2,
  FileText,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { ChatMessage, CitationItem, DocumentItem } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onSelectCitation: (citation: CitationItem) => void;
  selectedDocCount: number;
  totalDocCount: number;
  onOpenDocuments: () => void;
  activeConvTitle: string;
  chatMode: 'document_qa' | 'general_chat';
  onModeChange: (mode: 'document_qa' | 'general_chat') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  onSelectCitation,
  selectedDocCount,
  totalDocCount,
  onOpenDocuments,
  activeConvTitle,
  chatMode,
  onModeChange,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const suggestedQuestions = [
    "What is the main objective or executive summary?",
    "Explain the methodology or key approaches used.",
    "What are the key findings, statistics, or SLA metrics?",
    "Summarize the technical architecture or requirements.",
  ];

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden relative">
      {/* Top Conversation Header */}
      <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 flex items-center justify-between z-10 gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate max-w-xs">
              {activeConvTitle || 'New Conversation'}
            </span>
          </div>
          {chatMode === 'document_qa' && totalDocCount > 0 && (
            <button
              onClick={onOpenDocuments}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-medium transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {selectedDocCount > 0
                  ? `${selectedDocCount} of ${totalDocCount} docs scoped`
                  : `${totalDocCount} docs indexed`}
              </span>
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <button
            type="button"
            onClick={() => onModeChange('document_qa')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              chatMode === 'document_qa'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Answer strictly based on uploaded documents with citations"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document QA</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('general_chat')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              chatMode === 'general_chat'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Ask general knowledge, coding, or conversational questions"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>General AI Chat</span>
          </button>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Clear message history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center px-4 py-12">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm border ${
              chatMode === 'general_chat'
                ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-200/50 dark:border-violet-800/50 text-violet-600 dark:text-violet-400'
                : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400'
            }`}>
              {chatMode === 'general_chat' ? <Sparkles className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {chatMode === 'general_chat'
                ? 'General AI Chat Mode'
                : 'Ask questions grounded strictly in your documents'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {chatMode === 'general_chat'
                ? 'Ask open-ended questions, programming problems, concept explanations, or general knowledge powered directly by your configured LLM.'
                : 'Every answer is retrieved semantically from your indexed PDF, DOCX, and TXT files with precise source citations. If an answer cannot be found in the documents, the system will explicitly state so.'}
            </p>

            {chatMode === 'document_qa' && totalDocCount === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs text-left flex items-start space-x-3 w-full max-w-md">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">No documents uploaded yet</span>
                  <span>Click "Document Library" in the sidebar or upload a document to start semantic retrieval.</span>
                  <button
                    onClick={onOpenDocuments}
                    className="mt-2 block font-medium underline text-amber-900 dark:text-amber-100"
                  >
                    Open Document Library →
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left mb-2">
                  {chatMode === 'general_chat' ? 'Sample Questions:' : 'Suggested Document Questions:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {(chatMode === 'general_chat'
                    ? [
                        'What is the difference between SQL JOIN and UNION?',
                        'Explain Retrieval-Augmented Generation in simple terms.',
                        'How do database primary keys and foreign keys interact?',
                        'Write a Python function to parse JSON safely.'
                      ]
                    : suggestedQuestions
                  ).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(q)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm text-xs font-medium text-slate-700 dark:text-slate-300 transition text-left"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              const isGeneral = m.mode === 'general_chat';
              const isNotFound = m.content.includes("Answer not found in the uploaded documents.");

              return (
                <div
                  key={m.id}
                  className={`flex space-x-3 animate-in fade-in duration-200 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${
                      isGeneral
                        ? 'bg-gradient-to-tr from-violet-600 to-purple-500'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-500'
                    }`}>
                      {isGeneral ? <Sparkles className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                  )}

                  <div className={`space-y-2 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Mode Tag for Assistant */}
                    {!isUser && (
                      <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 px-1">
                        {isGeneral ? (
                          <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-semibold">
                            <Sparkles className="w-3 h-3" /> General AI Assistant
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                            <FileText className="w-3 h-3" /> Document QA
                          </span>
                        )}
                      </div>
                    )}

                    {/* Chat Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : isNotFound
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 rounded-bl-none'
                          : isGeneral
                          ? 'bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-900/40 text-slate-800 dark:text-slate-200 rounded-bl-none'
                          : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>

                    {/* Source Citations Tray (Only in Document QA mode) */}
                    {!isUser && !isGeneral && m.citations && m.citations.length > 0 && (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Verified Source References ({m.citations.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.citations.map((c) => (
                            <button
                              key={c.citation_id}
                              onClick={() => onSelectCitation(c)}
                              className="group flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-xs transition shadow-xs"
                              title="Click to inspect source text"
                            >
                              <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center">
                                {c.citation_id}
                              </span>
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                {c.document_name}
                              </span>
                              {c.page_number !== null && c.page_number !== undefined && c.page_number > 0 && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  p.{c.page_number}
                                </span>
                              )}
                              {c.section && c.section !== 'General' && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                  § {c.section}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex space-x-3 items-center justify-start animate-in fade-in duration-200">
                <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-sm ${
                  chatMode === 'general_chat'
                    ? 'bg-gradient-to-tr from-violet-600 to-purple-500'
                    : 'bg-gradient-to-tr from-indigo-600 to-violet-500'
                }`}>
                  {chatMode === 'general_chat' ? <Sparkles className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs flex items-center space-x-2.5 shadow-sm rounded-bl-none">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span>
                    {chatMode === 'general_chat'
                      ? 'Generating response using configured LLM...'
                      : 'Retrieving semantic passages & synthesizing answer...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <footer className="p-4 md:px-8 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              chatMode === 'general_chat'
                ? 'Ask any general question (e.g., Explain SQL joins or explain RAG architectures)...'
                : totalDocCount === 0
                ? 'Please upload documents first...'
                : 'Ask a question about the uploaded documents (e.g., What tables are created?)...'
            }
            className="w-full resize-none py-3.5 pl-4 pr-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm leading-normal max-h-40"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2.5 p-2 rounded-xl text-white transition shadow-sm disabled:cursor-not-allowed ${
              chatMode === 'general_chat'
                ? 'bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400'
            }`}
            title="Send question (Enter)"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="max-w-3xl mx-auto flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
          <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
          <span>
            {chatMode === 'general_chat'
              ? 'General AI mode • Powered by configured LLM'
              : 'Document QA mode • Answers strictly grounded on retrieved sources with citations'}
          </span>
        </div>
      </footer>
    </main>
  );
};
