import {
  DocumentItem,
  ConversationSummary,
  ConversationDetail,
  ChatMessage,
  SystemSettings
} from '../types';

const API_BASE = '/api';

export const api = {
  // Documents
  async listDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocuments(files: File[]): Promise<DocumentItem[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async loadSamples(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents/load-samples`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to load sample documents');
    return res.json();
  },

  async deleteDocument(docId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async reindexDocument(docId: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${docId}/reindex`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reindex document');
    return res.json();
  },

  // Conversations
  async listConversations(mode?: 'document_qa' | 'general_chat'): Promise<ConversationSummary[]> {
    const url = mode ? `${API_BASE}/conversations?mode=${mode}` : `${API_BASE}/conversations`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async createConversation(title?: string, mode: 'document_qa' | 'general_chat' = 'document_qa'): Promise<ConversationSummary> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, mode }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to load conversation details');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  // Chat
  async sendGeneralChatMessage(
    conversationId: string | null,
    message: string
  ): Promise<{ conversation_id: string; user_message: ChatMessage; assistant_message: ChatMessage }> {
    const res = await fetch(`${API_BASE}/chat/general`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send general chat message' }));
      throw new Error(err.detail || 'Failed to send general chat message');
    }
    return res.json();
  },

  async sendMessage(
    conversationId: string | null,
    message: string,
    documentIds?: string[],
    mode: 'document_qa' | 'general_chat' = 'document_qa'
  ): Promise<{ conversation_id: string; user_message: ChatMessage; assistant_message: ChatMessage }> {
    if (mode === 'general_chat') {
      return this.sendGeneralChatMessage(conversationId, message);
    }

    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        document_ids: documentIds && documentIds.length > 0 ? documentIds : undefined,
        mode: 'document_qa',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(data: {
    llm_provider?: string;
    gemini_api_key?: string;
    openai_api_key?: string;
  }): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },
};
