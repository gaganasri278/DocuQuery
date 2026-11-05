import React, { useState } from 'react';
import {
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  Files,
  Settings,
  Sun,
  Moon,
  Sparkles,
  FileText,
  Search,
  Pin,
  PinOff,
  Edit2,
  Check,
  X,
  Download,
  BookOpen,
  PenTool,
  BarChart3
} from 'lucide-react';
import { ConversationSummary, ActiveTab } from '../types';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onTogglePinConversation: (id: string, currentPinned: boolean, e: React.MouseEvent) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onExportConversation: (id: string, e: React.MouseEvent) => void;
  onOpenDocuments: () => void;
  onOpenSettings: () => void;
  docCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  chatMode: 'document_qa' | 'general_chat';
  onModeChange: (mode: 'document_qa' | 'general_chat') => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onTogglePinConversation,
  onRenameConversation,
  onExportConversation,
  onOpenDocuments,
  onOpenSettings,
  docCount,
  darkMode,
  onToggleDarkMode,
  chatMode,
  onModeChange,
  activeTab,
  onTabChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // Filter conversations by mode and search query
  const filteredConversations = conversations.filter(c => {
    const matchesMode = (c.mode || 'document_qa') === chatMode;
    const matchesSearch = searchQuery.trim()
      ? (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesMode && matchesSearch;
  });

  // Date categorization helper
  const categorizeConversations = () => {
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const pinned: ConversationSummary[] = [];
    const today: ConversationSummary[] = [];
    const yesterday: ConversationSummary[] = [];
    const previous7Days: ConversationSummary[] = [];
    const older: ConversationSummary[] = [];

    filteredConversations.forEach(c => {
      if (c.is_pinned) {
        pinned.push(c);
        return;
      }

      const updatedTime = new Date(c.updated_at || c.created_at).getTime();
      const diff = now - updatedTime;

      if (diff < oneDay) {
        today.push(c);
      } else if (diff < 2 * oneDay) {
        yesterday.push(c);
      } else if (diff < 7 * oneDay) {
        previous7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return [
      { label: '📌 Pinned Chats', items: pinned },
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Previous 7 Days', items: previous7Days },
      { label: 'Older', items: older },
    ].filter(g => g.items.length > 0);
  };

  const groups = categorizeConversations();

  const handleStartRename = (c: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(c.id);
    setRenameText(c.title || 'Untitled Chat');
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (renameText.trim()) {
      onRenameConversation(id, renameText.trim());
    }
    setRenamingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(null);
  };

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
              Intelligence Platform
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

      {/* Main Workspace Navigation Pills */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onTabChange('chat')}
            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('study')}
            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === 'study'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Study</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('writing')}
            className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === 'writing'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>
        </div>
      </div>

      {/* Chat Mode Selector (Only when in Chat Tab) */}
      {activeTab === 'chat' && (
        <div className="px-3 pt-2.5">
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
      )}

      {/* New Chat Primary Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onTabChange('chat');
            onNewChat();
          }}
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

      {/* Search Conversations Input */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past conversations..."
            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Conversations List with Date Grouping */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-400 dark:text-slate-500 text-xs">
            {searchQuery
              ? `No chats found matching "${searchQuery}".`
              : `No ${chatMode === 'general_chat' ? 'general AI' : 'document QA'} conversations yet.`}
          </div>
        ) : (
          groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {group.label}
              </div>

              {group.items.map((c) => {
                const isActive = c.id === activeConvId;
                const isRenaming = renamingId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (!isRenaming) {
                        onTabChange('chat');
                        onSelectConversation(c.id);
                      }
                    }}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1 pr-1">
                      {c.is_pinned ? (
                        <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      ) : chatMode === 'general_chat' ? (
                        <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`} />
                      ) : (
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      )}

                      {isRenaming ? (
                        <div className="flex items-center space-x-1 flex-1">
                          <input
                            type="text"
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(c.id, e as any);
                              if (e.key === 'Escape') handleCancelRename(e as any);
                            }}
                            autoFocus
                            className="w-full px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            onClick={(e) => handleSaveRename(c.id, e)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            title="Save title"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate" title={c.title}>
                          {c.title || 'Untitled Chat'}
                        </span>
                      )}
                    </div>

                    {/* Actions Toolbar on Hover */}
                    {!isRenaming && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 flex-shrink-0 transition">
                        {/* Pin / Unpin */}
                        <button
                          onClick={(e) => onTogglePinConversation(c.id, !!c.is_pinned, e)}
                          className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                          title={c.is_pinned ? 'Unpin chat' : 'Pin chat to top'}
                        >
                          {c.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>

                        {/* Inline Rename */}
                        <button
                          onClick={(e) => handleStartRename(c, e)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="Rename chat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Export Transcript */}
                        <button
                          onClick={(e) => onExportConversation(c.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="Export Transcript (TXT / PDF)"
                        >
                          <Download className="w-3 h-3" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => onDeleteConversation(c.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Bottom Menu: Dashboard, Document Library, Settings */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        {/* Dashboard Link */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'dashboard'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <span>Analytics Dashboard</span>
        </button>

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
