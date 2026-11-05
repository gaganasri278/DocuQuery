import {
  DocumentItem,
  ConversationSummary,
  ConversationDetail,
  ChatMessage,
  SystemSettings,
  DocumentSummary,
  DocumentCompareResult,
  DocumentPreview,
  MCQItem,
  FlashcardItem,
  StudySet,
  WritingResult,
  UserPreferences,
  DashboardStats
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

  // Document Intelligence
  async getDocumentPreview(docId: string): Promise<DocumentPreview> {
    const res = await fetch(`${API_BASE}/documents/${docId}/preview`);
    if (!res.ok) throw new Error('Failed to load document preview');
    return res.json();
  },

  async summarizeDocument(docId: string): Promise<DocumentSummary> {
    const res = await fetch(`${API_BASE}/documents/${docId}/summarize`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate document summary');
    return res.json();
  },

  async compareDocuments(documentIds: string[]): Promise<DocumentCompareResult> {
    const res = await fetch(`${API_BASE}/documents/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: documentIds })
    });
    if (!res.ok) throw new Error('Failed to compare documents');
    return res.json();
  },

  // Conversations
  async listConversations(mode?: 'document_qa' | 'general_chat', search?: string): Promise<ConversationSummary[]> {
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/conversations${queryString}`);
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

  async updateConversation(id: string, data: { title?: string; is_pinned?: boolean }): Promise<ConversationSummary> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
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

  async exportConversation(id: string): Promise<string> {
    const res = await fetch(`${API_BASE}/conversations/${id}/export`);
    if (!res.ok) throw new Error('Failed to export conversation');
    return res.text();
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

  // Study Assistant
  async generateMCQs(documentId: string, difficulty: string = 'medium', count: number = 5): Promise<MCQItem[]> {
    const res = await fetch(`${API_BASE}/study/mcq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, difficulty, count })
    });
    if (!res.ok) throw new Error('Failed to generate MCQs');
    return res.json();
  },

  async generateFlashcards(documentId: string, count: number = 6): Promise<FlashcardItem[]> {
    const res = await fetch(`${API_BASE}/study/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, count })
    });
    if (!res.ok) throw new Error('Failed to generate flashcards');
    return res.json();
  },

  async explainConcept(concept: string, level: string = 'beginner', documentId?: string): Promise<{ concept: string; level: string; explanation: string }> {
    const res = await fetch(`${API_BASE}/study/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept, level, document_id: documentId })
    });
    if (!res.ok) throw new Error('Failed to explain concept');
    return res.json();
  },

  async listStudySets(): Promise<StudySet[]> {
    const res = await fetch(`${API_BASE}/study/sets`);
    if (!res.ok) throw new Error('Failed to load study sets');
    return res.json();
  },

  // Writing Assistant
  async processWriting(data: {
    text: string;
    operation: string;
    tone?: string;
    target_length?: string;
  }): Promise<WritingResult> {
    const res = await fetch(`${API_BASE}/writing/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to process writing task');
    return res.json();
  },

  // Dashboard & Preferences
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to load dashboard statistics');
    return res.json();
  },

  async getPreferences(): Promise<UserPreferences> {
    const res = await fetch(`${API_BASE}/preferences`);
    if (!res.ok) throw new Error('Failed to load user preferences');
    return res.json();
  },

  async updatePreferences(data: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save preferences');
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
