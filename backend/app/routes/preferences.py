from fastapi import APIRouter
from app.models.schemas import UserPreferences
from app.database.connection import get_db

router = APIRouter(prefix="/api/preferences", tags=["preferences"])

@router.get("", response_model=UserPreferences)
def get_preferences():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_preferences WHERE id = 'default'")
        row = cursor.fetchone()
        if not row:
            # Seed default
            cursor.execute("""
                INSERT INTO user_preferences (id, response_length, response_style, tone, theme, voice_enabled)
                VALUES ('default', 'balanced', 'balanced', 'friendly', 'system', 1)
            """)
            conn.commit()
            return UserPreferences()

        return UserPreferences(
            response_length=row["response_length"],
            response_style=row["response_style"],
            tone=row["tone"],
            theme=row["theme"],
            voice_enabled=bool(row["voice_enabled"])
        )

@router.put("", response_model=UserPreferences)
def update_preferences(prefs: UserPreferences):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_preferences (id, response_length, response_style, tone, theme, voice_enabled, updated_at)
            VALUES ('default', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                response_length = excluded.response_length,
                response_style = excluded.response_style,
                tone = excluded.tone,
                theme = excluded.theme,
                voice_enabled = excluded.voice_enabled,
                updated_at = CURRENT_TIMESTAMP
        """, (
            prefs.response_length,
            prefs.response_style,
            prefs.tone,
            prefs.theme,
            1 if prefs.voice_enabled else 0
        ))
        conn.commit()
    return prefs
