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
    return {"status": "healthy"}

# Serve frontend production build if available
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Serve exact file if exists in dist (e.g. favicon.svg)
        target = frontend_dist / full_path
        if target.is_file():
            return FileResponse(target)
        # Otherwise fallback to index.html for SPA client-side routing
        return FileResponse(frontend_dist / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
