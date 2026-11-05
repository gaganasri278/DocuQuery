export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'ready' | 'processing' | 'failed';
  chunk_count: number;
  error_message?: string | null;
  created_at: string;
}

export interface CitationItem {
  citation_id: number;
  document_id: string;
  document_name: string;
  page_number?: number | null;
  section?: string | null;
  excerpt: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  citations?: CitationItem[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface SystemSettings {
  app_name: string;
  llm_provider: string;
  has_gemini_key: boolean;
  has_openai_key: boolean;
  active_model: string;
  embedding_model: string;
  total_documents: number;
  total_chunks: number;
}
