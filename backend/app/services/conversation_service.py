import uuid
from typing import List, Optional
from app.database.connection import get_db
from app.models.schemas import (
    ConversationSummary,
    ConversationDetail,
    MessageResponse,
    CitationItem
)

class ConversationService:
    def create_conversation(self, title: Optional[str] = "New Conversation", mode: str = "document_qa") -> ConversationSummary:
        conv_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute(
                "INSERT INTO conversations (id, title, mode) VALUES (?, ?, ?)",
                (conv_id, title or "New Conversation", mode)
            )
            conn.commit()

            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
            row = cursor.fetchone()

        return ConversationSummary(
            id=row["id"],
            title=row["title"],
            mode=row["mode"] if "mode" in row.keys() and row["mode"] else mode,
            is_pinned=bool(row["is_pinned"]) if "is_pinned" in row.keys() and row["is_pinned"] else False,
            created_at=str(row["created_at"]),
            updated_at=str(row["updated_at"]),
            message_count=0
        )

    def list_conversations(self, mode: Optional[str] = None, search: Optional[str] = None) -> List[ConversationSummary]:
        clean_mode = str(mode) if mode and isinstance(mode, str) else None
        clean_search = str(search).strip() if search and isinstance(search, str) and str(search).strip() else None

        with get_db() as conn:
            cursor = conn.cursor()
            query = """
                SELECT c.*, COUNT(m.id) as message_count
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
            """
            conditions = []
            params = []
            if clean_mode:
                conditions.append("c.mode = ?")
                params.append(clean_mode)
            if clean_search:
                conditions.append("(c.title LIKE ? OR c.id IN (SELECT conversation_id FROM messages WHERE content LIKE ?))")
                params.extend([f"%{clean_search}%", f"%{clean_search}%"])

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " GROUP BY c.id ORDER BY c.is_pinned DESC, c.updated_at DESC"
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()

        conversations = []
        for r in rows:
            is_pinned_val = bool(r["is_pinned"]) if "is_pinned" in r.keys() and r["is_pinned"] else False
            conversations.append(ConversationSummary(
                id=r["id"],
                title=r["title"],
                mode=r["mode"] if "mode" in r.keys() and r["mode"] else "document_qa",
                is_pinned=is_pinned_val,
                created_at=str(r["created_at"]),
                updated_at=str(r["updated_at"]),
                message_count=r["message_count"]
            ))
        return conversations

    def get_conversation(self, conv_id: str) -> Optional[ConversationDetail]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
            c_row = cursor.fetchone()
            if not c_row:
                return None

            cursor.execute("""
                SELECT * FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
            """, (conv_id,))
            m_rows = cursor.fetchall()

            messages = []
            for m in m_rows:
                # Fetch citations for message
                cursor.execute("""
                    SELECT * FROM citations
                    WHERE message_id = ?
                    ORDER BY rowid ASC
                """, (m["id"],))
                cit_rows = cursor.fetchall()

                citations = []
                for idx, c in enumerate(cit_rows, 1):
                    citations.append(CitationItem(
                        citation_id=idx,
                        document_id=c["document_id"],
                        document_name=c["document_name"],
                        page_number=c["page_number"],
                        section=c["section"],
                        excerpt=c["excerpt"],
                        relevance_score=c["relevance_score"]
                    ))

                mode_val = m["mode"] if "mode" in m.keys() and m["mode"] else "document_qa"
                messages.append(MessageResponse(
                    id=m["id"],
                    conversation_id=m["conversation_id"],
                    role=m["role"],
                    content=m["content"],
                    mode=mode_val,
                    created_at=str(m["created_at"]),
                    citations=citations
                ))
        is_pinned_val = bool(c_row["is_pinned"]) if "is_pinned" in c_row.keys() and c_row["is_pinned"] else False
        return ConversationDetail(
            id=c_row["id"],
            title=c_row["title"],
            mode=c_row["mode"] if "mode" in c_row.keys() and c_row["mode"] else "document_qa",
            is_pinned=is_pinned_val,
            created_at=str(c_row["created_at"]),
            updated_at=str(c_row["updated_at"]),
            messages=messages
        )

    def update_conversation(
        self,
        conv_id: str,
        title: Optional[str] = None,
        is_pinned: Optional[bool] = None
    ) -> Optional[ConversationSummary]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
            c_row = cursor.fetchone()
            if not c_row:
                return None

            updates = []
            params = []
            if title is not None and title.strip():
                updates.append("title = ?")
                params.append(title.strip())
            if is_pinned is not None:
                updates.append("is_pinned = ?")
                params.append(1 if is_pinned else 0)

            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(conv_id)
                query = f"UPDATE conversations SET {', '.join(updates)} WHERE id = ?"
                cursor.execute(query, tuple(params))
                conn.commit()

            cursor.execute("""
                SELECT c.*, COUNT(m.id) as message_count
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                WHERE c.id = ?
                GROUP BY c.id
            """, (conv_id,))
            row = cursor.fetchone()

        is_pinned_val = bool(row["is_pinned"]) if "is_pinned" in row.keys() and row["is_pinned"] else False
        return ConversationSummary(
            id=row["id"],
            title=row["title"],
            mode=row["mode"] if "mode" in row.keys() and row["mode"] else "document_qa",
            is_pinned=is_pinned_val,
            created_at=str(row["created_at"]),
            updated_at=str(row["updated_at"]),
            message_count=row["message_count"]
        )

    def delete_conversation(self, conv_id: str) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM conversations WHERE id = ?", (conv_id,))
            if not cursor.fetchone():
                return False

            cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
            conn.commit()
            return True

    def add_message(
        self,
        conv_id: str,
        role: str,
        content: str,
        citations: List[CitationItem] = [],
        mode: str = "document_qa"
    ) -> MessageResponse:
        msg_id = str(uuid.uuid4())
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO messages (id, conversation_id, role, content, mode) VALUES (?, ?, ?, ?, ?)",
                (msg_id, conv_id, role, content, mode)
            )

            # If user message is the first message in the conversation, update title
            if role == "user":
                cursor.execute("SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?", (conv_id,))
                cnt = cursor.fetchone()["cnt"]
                if cnt == 1:
                    # Generate concise title from first question
                    new_title = content.strip().splitlines()[0][:45]
                    cursor.execute(
                        "UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (new_title, conv_id)
                    )
                else:
                    cursor.execute(
                        "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (conv_id,)
                    )
            else:
                cursor.execute(
                    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (conv_id,)
                )

            # Insert citations if any
            for c in citations:
                cit_id = str(uuid.uuid4())
                cursor.execute(
                    """
                    INSERT INTO citations (
                        id, message_id, document_id, document_name,
                        page_number, section, excerpt, relevance_score, chunk_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        cit_id, msg_id, c.document_id, c.document_name,
                        c.page_number, c.section, c.excerpt, c.relevance_score,
                        f"chunk_{c.citation_id}"
                    )
                )

            conn.commit()

            cursor.execute("SELECT * FROM messages WHERE id = ?", (msg_id,))
            m = cursor.fetchone()

        return MessageResponse(
            id=m["id"],
            conversation_id=m["conversation_id"],
            role=m["role"],
            content=m["content"],
            mode=m["mode"] if "mode" in m.keys() and m["mode"] else mode,
            created_at=str(m["created_at"]),
            citations=citations
        )

    def get_conversation_history(self, conv_id: str, limit: int = 6) -> List[dict]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT role, content FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (conv_id, limit))
            rows = cursor.fetchall()

        history = [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]
        return history

conversation_service = ConversationService()
