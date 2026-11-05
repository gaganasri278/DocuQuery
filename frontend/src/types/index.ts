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
  mode?: 'document_qa' | 'general_chat';
}

export interface ConversationSummary {
  id: string;
  title: string;
  mode?: 'document_qa' | 'general_chat';
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  mode?: 'document_qa' | 'general_chat';
  is_pinned?: boolean;
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

export interface DocumentSummary {
  document_id: string;
  filename: string;
  summary: string;
  key_points: string[];
  definitions: { term: string; definition: string }[];
  revision_notes: string;
}

export interface DocumentCompareResult {
  document_titles: string[];
  synthesis: string;
  key_similarities: string[];
  key_differences: string[];
}

export interface DocumentPreview {
  document_id: string;
  filename: string;
  total_pages: number;
  total_chunks: number;
  content: string;
}

export interface MCQItem {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
}

export interface FlashcardItem {
  id: number;
  front: string;
  back: string;
  category: string;
}

export interface StudySet {
  id: string;
  document_id: string;
  document_name: string;
  set_type: 'mcq' | 'flashcards';
  title: string;
  data: any[];
  created_at: string;
}

export interface WritingResult {
  operation: string;
  result: string;
  original_length: number;
  result_length: number;
}

export interface UserPreferences {
  response_length: 'concise' | 'balanced' | 'detailed';
  response_style: 'standard' | 'bullet_points' | 'academic' | 'step_by_step';
  tone: 'friendly' | 'professional' | 'concise' | 'explanatory';
  theme: 'light' | 'dark' | 'system';
  voice_enabled: boolean;
}

export interface DashboardStats {
  total_documents: number;
  total_chunks: number;
  total_conversations: number;
  doc_qa_conversations: number;
  general_chat_conversations: number;
  active_model: string;
  embedding_model: string;
  llm_provider: string;
  recent_activities: {
    type: string;
    title: string;
    timestamp: string;
  }[];
}

export type ActiveTab = 'chat' | 'study' | 'writing' | 'dashboard' | 'library';
