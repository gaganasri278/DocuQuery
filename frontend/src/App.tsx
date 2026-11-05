import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { DocumentDrawer } from './components/DocumentDrawer';
import { CitationModal } from './components/CitationModal';
import { SettingsModal } from './components/SettingsModal';
import {
  DocumentItem,
  ConversationSummary,
  ChatMessage,
  CitationItem,
  SystemSettings
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('docuquery_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Data states
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [chatMode, setChatMode] = useState<'document_qa' | 'general_chat'>(() => {
    const savedMode = localStorage.getItem('docuquery_mode');
    return savedMode === 'general_chat' ? 'general_chat' : 'document_qa';
  });

  // UI Drawer / Modal states
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('docuquery_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('docuquery_theme', 'light');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [docs, convs, settings] = await Promise.all([
        api.listDocuments(),
        api.listConversations(),
        api.getSettings(),
      ]);
      setDocuments(docs);
      setConversations(convs);
      setSystemSettings(settings);

      // If conversations exist matching current mode, load the most recent one
      const matching = convs.filter(c => (c.mode || 'document_qa') === chatMode);
      if (matching.length > 0) {
        loadConversation(matching[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const handleModeChange = (newMode: 'document_qa' | 'general_chat') => {
    setChatMode(newMode);
    localStorage.setItem('docuquery_mode', newMode);

    // Switch to first conversation matching the new mode, or open a clean new chat
    const matching = conversations.filter(c => (c.mode || 'document_qa') === newMode);
    if (matching.length > 0) {
      loadConversation(matching[0].id);
    } else {
      handleNewChat();
    }
  };

  const handleReindexDocument = async (docId: string) => {
    setIsUploading(true);
    try {
      await api.reindexDocument(docId);
      const [updatedDocs, s] = await Promise.all([
        api.listDocuments(),
        api.getSettings()
      ]);
      setDocuments(updatedDocs);
      setSystemSettings(s);
    } catch (err: any) {
      alert(`Re-indexing failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId);
    try {
      const detail = await api.getConversation(convId);
      setMessages(detail.messages);
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    if (id !== activeConvId) {
      loadConversation(id);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);

    // Optimistically show user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || '',
      role: 'user',
      content: text,
      mode: chatMode,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.sendMessage(
        activeConvId,
        text,
        selectedDocIds.length > 0 ? selectedDocIds : undefined,
        chatMode
      );

      // Update active conversation ID
      setActiveConvId(res.conversation_id);

      // Replace messages with verified database messages
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        res.user_message,
        res.assistant_message,
      ]);

      // Refresh conversations list to update title and order
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeConvId || '',
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to process question.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (activeConvId) {
      await api.deleteConversation(activeConvId);
      const remaining = conversations.filter(c => c.id !== activeConvId);
      setConversations(remaining);
    }
    handleNewChat();
  };

  const handleUploadFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      const newDocs = await api.uploadDocuments(files);
      const updatedList = await api.listDocuments();
      setDocuments(updatedList);

      // Refresh system settings stats
      const s = await api.getSettings();
      setSystemSettings(s);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSamples = async () => {
    setIsUploading(true);
    try {
      await api.loadSamples();
      const updatedList = await api.listDocuments();
      setDocuments(updatedList);
      const s = await api.getSettings();
      setSystemSettings(s);
    } catch (err: any) {
      alert(`Loading samples failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setSelectedDocIds(prev => prev.filter(id => id !== docId));

      const s = await api.getSettings();
      setSystemSettings(s);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleDocFilter = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenDocuments={() => setIsDocDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        docCount={documents.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        chatMode={chatMode}
        onModeChange={handleModeChange}
      />

      {/* Main Chat Interface */}
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        onSelectCitation={(cit) => setSelectedCitation(cit)}
        selectedDocCount={selectedDocIds.length}
        totalDocCount={documents.length}
        onOpenDocuments={() => setIsDocDrawerOpen(true)}
        activeConvTitle={activeConv ? activeConv.title : 'New Chat'}
        chatMode={chatMode}
        onModeChange={handleModeChange}
      />

      {/* Document Management Drawer */}
      <DocumentDrawer
        isOpen={isDocDrawerOpen}
        onClose={() => setIsDocDrawerOpen(false)}
        documents={documents}
        selectedDocIds={selectedDocIds}
        onToggleDocFilter={handleToggleDocFilter}
        onSelectAllDocs={() => setSelectedDocIds(documents.map(d => d.id))}
        onClearDocFilter={() => setSelectedDocIds([])}
        onUploadFiles={handleUploadFiles}
        onLoadSamples={handleLoadSamples}
        onDeleteDocument={handleDeleteDocument}
        onReindexDocument={handleReindexDocument}
        isUploading={isUploading}
      />

      {/* Citation Inspector Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={systemSettings}
        onSettingsUpdated={(newS) => setSystemSettings(newS)}
      />
    </div>
  );
};
