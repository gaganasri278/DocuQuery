import React from 'react';
import {
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  Files,
  Settings,
  Sun,
  Moon,
  Sparkles,
  FileText
} from 'lucide-react';
import { ConversationSummary } from '../types';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onOpenDocuments: () => void;
  onOpenSettings: () => void;
  docCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  chatMode: 'document_qa' | 'general_chat';
  onModeChange: (mode: 'document_qa' | 'general_chat') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenDocuments,
  onOpenSettings,
  docCount,
  darkMode,
  onToggleDarkMode,
  chatMode,
  onModeChange,
}) => {
  const filteredConversations = conversations.filter(c => (c.mode || 'document_qa') === chatMode);

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight flex items-center gap-1.5">
              DocuQuery AI
            </h1>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
              Document QA & General AI
            </span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode Selector in Sidebar */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onModeChange('document_qa')}
            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              chatMode === 'document_qa'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Doc QA</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('general_chat')}
            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              chatMode === 'general_chat'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>General AI</span>
          </button>
        </div>
      </div>

      {/* New Chat Primary Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-white font-medium text-sm transition shadow-sm active:scale-[0.99] ${
            chatMode === 'general_chat'
              ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New {chatMode === 'general_chat' ? 'General AI' : 'Document'} Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {chatMode === 'general_chat' ? 'General AI Chats' : 'Document QA Chats'}
        </div>

        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-400 dark:text-slate-500 text-xs">
            No {chatMode === 'general_chat' ? 'general AI' : 'document QA'} conversations yet.
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = c.id === activeConvId;
            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  {chatMode === 'general_chat' ? (
                    <Sparkles className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`} />
                  ) : (
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  )}
                  <span className="truncate" title={c.title}>
                    {c.title || 'Untitled Chat'}
                  </span>
                </div>

                <button
                  onClick={(e) => onDeleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Menu / Document Manager & Settings */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        {/* Document Knowledge Base Trigger */}
        <button
          onClick={onOpenDocuments}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <div className="flex items-center space-x-2">
            <Files className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Document Library</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            {docCount}
          </span>
        </button>

        {/* Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Model & Settings</span>
        </button>
      </div>
    </aside>
  );
};
