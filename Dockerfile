# ==========================================
# Stage 1: Build the React frontend
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /build

# Install dependencies with frozen lockfile
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source files & build production assets
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python Backend & Runtime Environment
# ==========================================
FROM python:3.12-slim AS runner

# Configure environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    DATA_DIR=/app/data \
    FRONTEND_DIST_DIR=/app/frontend/dist \
    HF_HOME=/app/model_cache \
    TRANSFORMERS_CACHE=/app/model_cache \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    TOKENIZERS_PARALLELISM=false

WORKDIR /app

# Install system dependencies (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download SentenceTransformer all-MiniLM-L6-v2 during build so it is baked into the image
# Temporarily enable network to fetch and cache the model weights into /app/model_cache
RUN python -c "import os; os.environ['HF_HUB_OFFLINE']='0'; os.environ['TRANSFORMERS_OFFLINE']='0'; from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy backend application code & benchmark samples
COPY backend/app ./app
COPY backend/test_samples ./test_samples

# Copy the built frontend artifacts from Stage 1
COPY --from=frontend-builder /build/dist ./frontend/dist

# Ensure writable data directory for SQLite and ChromaDB
RUN mkdir -p /app/data/uploads /app/data/chroma_db

EXPOSE 8000

# Container healthcheck using /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-8000}/api/health || exit 1

# Start Uvicorn bound to 0.0.0.0 and dynamic Render PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
