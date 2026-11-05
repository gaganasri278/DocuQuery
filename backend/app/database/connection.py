import sqlite3
from contextlib import contextmanager
from app.config import settings

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'processing',
                chunk_count INTEGER NOT NULL DEFAULT 0,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Conversations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                mode TEXT DEFAULT 'document_qa',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                mode TEXT DEFAULT 'document_qa',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )
        """)

        # Migration: ensure mode and is_pinned columns exist in pre-existing tables
        try:
            cursor.execute("ALTER TABLE conversations ADD COLUMN mode TEXT DEFAULT 'document_qa'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE conversations ADD COLUMN is_pinned INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE messages ADD COLUMN mode TEXT DEFAULT 'document_qa'")
        except Exception:
            pass
        
        # Citations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS citations (
                id TEXT PRIMARY KEY,
                message_id TEXT NOT NULL,
                document_id TEXT,
                document_name TEXT NOT NULL,
                page_number INTEGER,
                section TEXT,
                excerpt TEXT NOT NULL,
                relevance_score REAL NOT NULL,
                chunk_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
            )
        """)

        # User preferences table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id TEXT PRIMARY KEY,
                response_length TEXT DEFAULT 'balanced',
                response_style TEXT DEFAULT 'balanced',
                tone TEXT DEFAULT 'friendly',
                theme TEXT DEFAULT 'system',
                voice_enabled INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Study sets table (MCQs, Flashcards, Summaries)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_sets (
                id TEXT PRIMARY KEY,
                document_id TEXT,
                document_name TEXT,
                set_type TEXT NOT NULL,
                title TEXT NOT NULL,
                data_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        """)
        
        # Indexes for fast querying
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_citations_msg ON citations(message_id)")
        
        conn.commit()

@contextmanager
def get_db():
    conn = sqlite3.connect(settings.sqlite_db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()
