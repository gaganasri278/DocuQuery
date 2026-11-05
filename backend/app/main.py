import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database.connection import init_db
from app.routes import documents_router, conversations_router, chat_router, settings_router

# Initialize SQLite database schema
init_db()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-quality AI Document Question Answering System with semantic retrieval and citations."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(documents_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(settings_router)

@app.get("/api/health")
def health():
    """Health check endpoint for Render / Docker orchestration."""
    return {"status": "healthy"}

# Determine frontend static directory (supports local dev and container paths)
frontend_dist = None
env_dist = os.getenv("FRONTEND_DIST_DIR")
if env_dist and Path(env_dist).is_dir():
    frontend_dist = Path(env_dist)
else:
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path(__file__).resolve().parent.parent / "frontend" / "dist",
        Path("/app/frontend/dist"),
        Path("./frontend/dist"),
    ]
    for c in candidates:
        if c.is_dir():
            frontend_dist = c
            break

if frontend_dist:
    assets_dir = frontend_dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path:
            target = frontend_dist / full_path
            if target.is_file():
                return FileResponse(target)
        index_file = frontend_dist / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)
        return {"status": "online", "message": "DocuQuery AI Backend Ready"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
