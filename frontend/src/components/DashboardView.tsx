import React, { useEffect, useState } from 'react';
import {
  FileText,
  Layers,
  MessageSquare,
  Sparkles,
  Cpu,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen,
  PenTool,
  UploadCloud
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  onNavigateToTab: (tab: 'chat' | 'study' | 'writing' | 'library') => void;
  onOpenDocuments: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  onOpenDocuments
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>DocuQuery AI Hub</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                v2.0 Pro
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time platform metrics, document vector indexes, active AI models, and rapid workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('chat')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Chat</span>
            </button>
            <button
              onClick={loadStats}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Refresh Analytics"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Documents Indexed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Total Documents
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : stats?.total_documents ?? 0}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                Active Knowledge Base
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Semantic Chunks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Vector Chunks
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : stats?.total_chunks ?? 0}
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block">
                ChromaDB HNSW Index
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Total Conversations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Conversations
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : stats?.total_conversations ?? 0}
              </span>
              <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium block">
                {stats?.doc_qa_conversations ?? 0} Doc QA • {stats?.general_chat_conversations ?? 0} General AI
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: AI Model Status */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Primary AI Model
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono truncate block max-w-[130px]">
                {loading ? '...' : stats?.active_model || 'gemini-3.8-flash'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Operational
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick-Action Launchpad */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Quick-Action Launchpad</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1: Document QA */}
            <div
              onClick={() => onNavigateToTab('chat')}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer transition space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition flex items-center justify-between">
                  <span>Document QA (RAG)</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Query your uploaded PDFs and notes with semantic vector retrieval and verified citations.
                </p>
              </div>
            </div>

            {/* Action 2: Study Assistant */}
            <div
              onClick={() => onNavigateToTab('study')}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md cursor-pointer transition space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition flex items-center justify-between">
                  <span>AI Study Assistant</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Generate interactive MCQ quizzes, 3D flip flashcards, and plain-English concept breakdowns.
                </p>
              </div>
            </div>

            {/* Action 3: Writing Assistant */}
            <div
              onClick={() => onNavigateToTab('writing')}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-md cursor-pointer transition space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition flex items-center justify-between">
                  <span>AI Writing Assistant</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Rewrite notes, polish grammar, switch tones, draft executive emails, and generate reports.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live System Architecture & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Feed */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Recent Activity Feed</span>
            </h3>

            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recent_activities.map((act, idx) => (
                  <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {act.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent activity recorded yet.
              </div>
            )}
          </div>

          {/* System Specifications & Architecture */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span>Engine Architecture</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Embedding Model</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {stats?.embedding_model || 'sentence-transformers/all-MiniLM-L6-v2'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Vector Store</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  ChromaDB Persistent (Cosine Similarity)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">LLM Primary / Fallback</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  gemini-3.8-flash ➔ gemini-3.1-flash-lite
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Database Persistence</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  SQLite (Conversations, Messages, Documents, Preferences)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
