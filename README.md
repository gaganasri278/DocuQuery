# DocuQuery AI: Intelligent Document Question Answering System

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-VectorStore-orange.svg)](https://www.trychroma.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An intelligent, production-quality Document Question Answering System powered by **Retrieval-Augmented Generation (RAG)**. Users can upload collections of documents (**PDF**, **DOCX**, and **TXT**) and ask natural-language questions. 

DocuQuery AI provides **accurate, concise answers grounded strictly and exclusively in the supplied documents**, accompanied by **interactive, verified source citations** (page numbers for PDFs, section titles for DOCX/TXT, and exact supporting passages).

If the requested information is absent or insufficient in the uploaded documents, the system adheres to strict factual guardrails and explicitly responds:
> *"Answer not found in the uploaded documents."*

---

## Architecture Overview

DocuQuery AI decouples document processing, semantic embeddings, vector indexing, neural retrieval, generative synthesis, and persistent conversational state:

```
[ User Uploads (PDF / DOCX / TXT) ]
                │
                ▼
   [ PyMuPDF / python-docx / IO ]  ───► Page & Section Metadata Preservation
                │
                ▼
      [ Text Normalizer & Chunker ] ───► Sliding Window (600 chars, 120 overlap)
                │
                ▼
   [ SentenceTransformer (MiniLM) ] ───► 384-dimensional Normalized Embeddings
                │
                ▼
         [ ChromaDB VectorStore ]  ───► Cosine Space Vector Indexing
                ▲
                │ Semantic Search
                ▼
      [ Natural Language Question ]
                │
                ▼
 [ Query Embedding & Distance Filter ] ───► Relevance Thresholding (max_dist <= 0.65)
                │
                ▼
    [ Grounded RAG Orchestrator ]
         ├── Injected Prompt Sandbox (<untrusted_document_context>)
         ├── Anti-Hallucination & Anti-Prompt-Injection Guardrails
         └── Configurable Provider (Local Engine / Gemini / OpenAI / Ollama)
                │
                ▼
  [ Answer Synthesis + Traceable Citations ]
                │
                ▼
     [ SQLite Chat History & Persistence ]
                │
                ▼
    [ Responsive React + Tailwind UI ]
```

---

## Key Features

1. **Multi-Format Ingestion**:
   - **PDF**: Page-by-page text extraction with PyMuPDF (`fitz`), preserving physical page boundaries.
   - **DOCX**: Structural extraction via `python-docx`, maintaining document heading hierarchy.
   - **TXT**: Structural paragraph and section segmentation.
   - Validation against empty or corrupt files with graceful error boundaries.

2. **High-Precision Semantic Retrieval**:
   - `sentence-transformers/all-MiniLM-L6-v2` generates 384-dimensional embeddings.
   - ChromaDB persistent vector collection in cosine space (`hnsw:space: cosine`).
   - Strict distance thresholding prevents hallucination when documents lack relevant information.

3. **Traceable Interactive Citations**:
   - Every answer displays clickable citation pills.
   - Clicking a citation opens a **Source Inspector** displaying the document title, exact page number, section heading, relevance score, and verified passage excerpt.

4. **Multiple AI Providers Supported**:
   - **Local Semantic Extractive Engine**: Works immediately out-of-the-box with **zero external API keys or network dependencies**.
   - **Google Gemini**: Native API integration (`gemini-3.8-flash`, with automatic fallback to `gemini-3.5-flash` / `gemini-3.1-flash-lite`).
   - **OpenAI**: Native API integration (`gpt-4o-mini`, `gpt-4o`).
   - **Ollama**: Local open-source models (`llama3`, `mistral`).

5. **Conversational Context & History**:
   - SQLite persistence tracks all conversation sessions, messages, and citation links.
   - Ability to create new chats, switch between previous discussions, and delete chats.
   - Follow-up questions maintain conversational thread without allowing historical assumptions to introduce ungrounded facts.

6. **Smart Chat Management**:
   - Real-time search across all previous conversations.
   - Intelligent date grouping: **📌 Pinned**, **Today**, **Yesterday**, **Previous 7 Days**, and **Older**.
   - Pin important conversations to keep them at the top.
   - Inline conversation renaming and deletion with confirmation.
   - Export conversations as structured `.txt` transcripts with timestamps, message roles, and source citations.
   - Separate, dedicated histories for Document QA and General AI Chat.

7. **Advanced Document Intelligence**:
   - **Executive Summarization**: Synthesizes multi-paragraph summaries of entire documents.
   - **Key Takeaways**: Automatically extracts 5–8 high-yield bulleted takeaways.
   - **Definitions & Terminology Glossary**: Builds structured domain glossaries.
   - **Chapter Revision Notes**: Produces clean Markdown notes for studying.
   - **Multi-Document Comparison**: Selects 2+ documents to generate comparative synthesis, similarities, and differences side by side.
   - **Document Previewer**: In-app document reader with in-document keyword search and excerpt copying.

8. **AI Study Assistant**:
   - **Interactive MCQ Quiz**: Customizable difficulty (Easy/Medium/Hard) with instant scoring, green/red option feedback, and pedagogical explanations.
   - **Interactive 3D Flip Flashcards**: Revision cards with CSS 3D flip animation, carousel navigation, and card counter.
   - **Concept Simplifier ("Explain like I'm 5")**: Demystifies technical concepts tailored for Beginner, Intermediate, or Advanced learners.

9. **AI Writing Assistant**:
   - Dual-pane workspace with live word counters.
   - One-click actions: *Rewrite & Polish*, *Fix Grammar & Typos*, *Simplify (Plain English)*, *Summarize Text*, *Draft Email*, *Executive Business Report*.
   - Tone controls (Professional, Friendly, Academic, Technical, Persuasive, Concise) and target lengths (Concise, Balanced, Detailed).

10. **Voice Interaction & Smart Controls**:
    - **Speech-to-Text**: Microphone button using Web Speech API with pulsing recording animation that transcribes voice into text.
    - **Text-to-Speech**: Speaker button with Play, Pause, and Stop controls using browser speech synthesis.
    - **Message Controls**: Copy response, regenerate response, edit previous user prompts, stop active generation.
    - **Rich Markdown Engine**: Syntax-highlighted code blocks with copy-code buttons, responsive tables, and KaTeX math formulas.

11. **Analytics Dashboard & Personalization**:
    - Live metrics tracking Total Documents, Vector Chunks, Total Conversations, Active AI Model (`gemini-3.8-flash`), and Recent Activity Feed.
    - Customizable response length, response style (Standard / Bullet Points / Step-by-Step / Academic), and theme (Light / Dark / System).

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide React, Vite |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Document Processing** | PyMuPDF (`fitz`), python-docx |
| **Vector DB & Retrieval** | ChromaDB (Persistent), Sentence Transformers (`all-MiniLM-L6-v2`), PyTorch |
| **Relational Database** | SQLite (Metadata, conversations, messages, citations) |
| **Deployment** | Docker (Multi-stage), Render Blueprint (`render.yaml`) |
| **Testing** | Pytest, FastAPI TestClient |

---

## Project Structure

```
document-qa-system/
│
├── Dockerfile                          # Multi-stage production container build
├── .dockerignore                       # Docker build exclusions
├── render.yaml                         # Render Blueprint specification
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application & SPA static server
│   │   ├── config.py                   # App configuration & environment variables
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── connection.py           # SQLite schema & connection management
│   │   ├── document_processing/
│   │   │   ├── __init__.py
│   │   │   ├── extractor.py            # PDF, DOCX, TXT extractors
│   │   │   ├── cleaner.py              # Text normalization
│   │   │   └── chunker.py              # Metadata-preserving text chunker
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py              # Pydantic request/response schemas
│   │   ├── retrieval/
│   │   │   ├── __init__.py
│   │   │   ├── embeddings.py           # Sentence-transformers embedding service
│   │   │   └── vector_store.py         # ChromaDB client & vector search
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── documents.py            # Document upload, delete, list endpoints
│   │   │   ├── conversations.py        # Conversation sessions management & export
│   │   │   ├── chat.py                 # RAG Document QA & General AI endpoints
│   │   │   ├── document_intelligence.py# Summarize, key points, definitions, compare
│   │   │   ├── study.py                # MCQ quizzes, flashcards, concept explainer
│   │   │   ├── writing.py              # Text polish, grammar, tones, reports, emails
│   │   │   ├── dashboard.py            # Live platform analytics
│   │   │   ├── preferences.py          # User personalization preferences
│   │   │   └── settings.py             # System & AI provider settings
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── document_service.py     # Document lifecycle & indexing
│   │       ├── conversation_service.py # Chat history & message persistence
│   │       ├── document_intelligence.py# Summarization & comparison service
│   │       ├── study_service.py        # MCQ & flashcard generator service
│   │       ├── writing_service.py      # Writing transformations service
│   │       ├── llm_provider.py         # Gemini, OpenAI, Ollama, & Local engine
│   │       └── rag_service.py          # Complete RAG pipeline orchestrator
│   │
│   ├── tests/
│   │   ├── test_document_processing.py # PDF, DOCX, TXT extraction & chunk tests
│   │   ├── test_retrieval.py           # Embeddings & ChromaDB search tests
│   │   ├── test_rag_service.py         # Grounding & Not-Found functionality tests
│   │   └── test_api_endpoints.py       # REST API integration & lifecycle tests
│   │
│   ├── test_samples/                   # Bundled benchmark test files
│   │   ├── sample_contract.pdf
│   │   ├── sample_technical_spec.docx
│   │   └── sample_notes.txt
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx             # History, search, pin/rename, export
│   │   │   ├── ChatArea.tsx            # Rich markdown, citations, mic & speaker
│   │   │   ├── DashboardView.tsx       # Live platform metrics & quick actions
│   │   │   ├── StudyAssistantView.tsx  # MCQ quizzes, 3D flashcards, explainer
│   │   │   ├── WritingAssistantView.tsx# Dual-pane text editor & tone switcher
│   │   │   ├── DocumentDrawer.tsx      # Upload dropzone & document list
│   │   │   ├── DocumentPreviewModal.tsx# In-app document reader & keyword search
│   │   │   ├── DocumentIntelligenceModal.tsx # Summary, key points, compare
│   │   │   ├── MarkdownRenderer.tsx    # Code highlighting, tables, KaTeX math
│   │   │   ├── CitationModal.tsx       # Verified excerpt inspector
│   │   │   └── SettingsModal.tsx       # AI Provider, keys & personalization
│   │   ├── services/
│   │   │   └── api.ts                  # Typed API client
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript interfaces
│   │   ├── App.tsx                     # Main layout & state coordinator
│   │   ├── main.tsx                    # React entry point
│   │   └── index.css                   # Tailwind styles
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## Deployment on Render

DocuQuery AI is fully containerized and pre-configured for public deployment on **Render** using a multi-stage Docker build.

### Deploying via Render Dashboard (Recommended)

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`https://github.com/gaganasri278/DocuQuery`).
4. Configure the service settings:
   - **Name**: `docuquery` (or your preferred name)
   - **Runtime**: **Docker**
   - **Plan**: **Free**
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, you can optionally configure:
   - `LLM_PROVIDER`: `local` (default, no API keys needed), or `gemini`, or `openai`.
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key if using Gemini.
   - `OPENAI_API_KEY`: *(Optional)* Your OpenAI API key if using OpenAI.
6. Click **Deploy Web Service**. Render will automatically build the React frontend, package the Python FastAPI backend, cache the embedding model, and deploy the application.

### Deploying via Render Blueprint

You can also use the included [`render.yaml`](render.yaml) file:
1. In the Render Dashboard, click **New +** > **Blueprint**.
2. Select the `DocuQuery` repository.
3. Render will read `render.yaml` and configure the web service, Dockerfile path, and health checks automatically.

### Important Storage Persistence Limitations on Render (Free Plan)

- **Ephemeral Filesystem**: Render's **Free Tier** uses an ephemeral container filesystem. Any documents uploaded to `/app/data/uploads`, SQLite conversation histories stored in `/app/data/qa_system.db`, and ChromaDB vector indices stored in `/app/data/chroma_db` will reset when the service spins down after 15 minutes of inactivity or when redeployed.
- **Persistent Disks**: To retain uploaded documents and embeddings across container restarts and sleep cycles, Render requires a paid plan (Starter or higher) with a **Persistent Disk** mounted to `/data` and setting the environment variable `DATA_DIR=/data`.
- **Bundled Benchmark Documents**: Even on the Free plan, users can click the **"Load Samples"** button inside the Document Library to instantly reload the bundled PDF, DOCX, and TXT benchmark files into the vector database in seconds.

---

## Getting Started Locally

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. (Optional) Configure environment variables:
   Copy `.env.example` to `backend/.env`:
   ```bash
   cp ../.env.example .env
   ```
   *Note: By default, `LLM_PROVIDER=local` is active, which runs fully offline without requiring any API keys!*

5. Run backend tests to verify your environment:
   ```bash
   python -m pytest tests -v
   ```

6. Start the backend API server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Interactive API docs are available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application UI will be available at [http://localhost:3000](http://localhost:3000).

4. (Optional) Build for production:
   ```bash
   npm run build
   ```
   *The FastAPI backend automatically serves the production build at `http://127.0.0.1:8000/` when built.*

---

## Configuring AI Providers

You can switch providers dynamically in the **Settings Modal** in the UI or via `.env`:

### 1. Local Semantic Engine (Default)
- **Zero API keys required.**
- Operates locally using `sentence-transformers` semantic similarity and sentence-level token overlap ranking.
- Suitable for private or offline deployments.

### 2. Google Gemini
- Set `LLM_PROVIDER=gemini`
- Set `GEMINI_API_KEY=your_gemini_api_key`
- Model default: `gemini-3.8-flash`

### 3. OpenAI
- Set `LLM_PROVIDER=openai`
- Set `OPENAI_API_KEY=your_openai_api_key`
- Model default: `gpt-4o-mini`

### 4. Ollama (Self-Hosted)
- Set `LLM_PROVIDER=ollama`
- Set `OLLAMA_BASE_URL=http://localhost:11434`
- Set `OLLAMA_MODEL=llama3`

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload multiple PDF, DOCX, or TXT documents |
| `POST` | `/api/documents/load-samples` | Load bundled benchmark sample documents |
| `GET` | `/api/documents` | List all indexed documents and metadata |
| `GET` | `/api/documents/{id}` | Retrieve single document metadata |
| `DELETE` | `/api/documents/{id}` | Delete document, chunks, and vector embeddings |
| `POST` | `/api/chat` | Send a question; returns answer and citations |
| `GET` | `/api/conversations` | List past conversation sessions |
| `POST` | `/api/conversations` | Create a new conversation session |
| `GET` | `/api/conversations/{id}` | Retrieve messages and citations for conversation |
| `DELETE` | `/api/conversations/{id}` | Delete conversation and message history |
| `GET` | `/api/settings` | Retrieve active LLM provider and index stats |
| `POST` | `/api/settings` | Update LLM provider and API keys |
| `GET` | `/api/health` | Service health check |

---

## Testing & Verification Results

The automated test suite covers all requirements:

```
tests/test_api_endpoints.py::test_settings_endpoints PASSED
tests/test_api_endpoints.py::test_document_and_chat_lifecycle PASSED
tests/test_api_endpoints.py::test_load_sample_documents PASSED
tests/test_document_processing.py::test_clean_text PASSED
tests/test_document_processing.py::test_extract_pdf PASSED
tests/test_document_processing.py::test_extract_docx PASSED
tests/test_document_processing.py::test_extract_txt PASSED
tests/test_document_processing.py::test_chunking PASSED
tests/test_document_processing.py::test_empty_file_handling PASSED
tests/test_document_processing.py::test_corrupt_file_handling PASSED
tests/test_rag_service.py::test_rag_with_known_context PASSED
tests/test_rag_service.py::test_rag_answer_not_found PASSED
tests/test_retrieval.py::test_embeddings_generation PASSED
tests/test_retrieval.py::test_vector_store_add_and_search PASSED

============================= 14 passed =============================
```

---

## Security & Reliability Considerations

- **Untrusted Document Context**: Uploaded document passages are wrapped inside `<untrusted_document_context>` XML tags with explicit system instructions to ignore prompt injection attempts within document text.
- **Strict Grounding Guardrails**: If cosine distance exceeds `0.65` or context is insufficient, the system returns `"Answer not found in the uploaded documents."`
- **File Validation**: Strict file type check (`.pdf`, `.docx`, `.txt`) and 25 MB size limits prevent resource exhaustion.
- **Secrets Protection**: API keys are isolated via environment variables and never logged or exposed in client responses.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
