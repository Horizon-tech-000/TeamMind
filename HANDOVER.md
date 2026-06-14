# TeamMind — Project Handover Document

## 1. Project Overview
**TeamMind** is an AI-powered knowledge retrieval platform for engineering and product teams. It allows users to connect fragmented data sources (Google Drive, Slack, Jira, Confluence) into a single workspace, and use natural language to query their team's collective knowledge.

The goal is to provide high-confidence, cited answers to technical and organizational questions by parsing internal documents.

## 2. Technology Stack
*   **Frontend**: React 18, [TanStack Start](https://tanstack.com/start) (Full-stack React framework), Vite.
*   **Styling**: Tailwind CSS + shadcn/ui components (Radix UI primitives).
*   **Backend**: Node.js (Server Functions via TanStack Start).
*   **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Supabase Auth).
*   **AI Engine**: Custom multi-provider abstraction supporting local and cloud LLMs.

## 3. Current State of Implementation (What works right now)

### Database & Auth
*   **Supabase Auth**: Fully wired up for email/password login, signup, and password reset.
*   **Row Level Security (RLS)**: Highly secure policies are active. Users can only read/write data for projects they explicitly belong to.
*   **Tables Implemented**: 
    *   `projects`, `project_members`, `connected_sources`
    *   `questions`, `answers`, `answer_feedback`
    *   `user_integrations` (Schema exists, but token syncing is pending).

### Frontend UI
*   `routes/login.tsx`: Auth flow.
*   `routes/dashboard.tsx`: Lists user's projects.
*   `routes/projects.tsx`: The core workspace. Users can view team members, connected sources, and use the central "Ask" box to generate AI answers.
*   `routes/settings.tsx`: Profile management and OAuth connection buttons (Google, Slack, Jira, Confluence).

### AI & Backend Logic
*   `src/lib/ai-provider.ts`: A fully abstract AI generation layer. It seamlessly swaps between:
    *   `mock`: Returns hardcoded responses (requires no keys).
    *   `ollama`: Connects to local `http://127.0.0.1:11434` for offline Llama models.
    *   `openai` & `gemini`: Connects to cloud providers via standard APIs.
*   `src/lib/ask-question.ts`: A secure server function (`createServerFn`) that validates project membership, logs the question to the database, queries the `ai-provider`, saves the generated answer, and returns it to the client.

## 4. What is Missing / Next Steps (For the Next Agent)
The platform is beautifully designed and has a fully working end-to-end flow, but the **data ingestion** and **vector search** layers are not yet implemented.

Here is what the next AI Agent should tackle:

### Step 1: Real Retrieval-Augmented Generation (RAG)
Currently, `ask-question.ts` passes basic project metadata to the AI. To make it a true knowledge base:
1. Enable the `pgvector` extension in Supabase.
2. Create a `documents` table with a `vector` column for embeddings.
3. Update `ask-question.ts` to perform a cosine-similarity search against the `documents` table to retrieve relevant chunks of text before passing them to the AI prompt.

### Step 2: OAuth Data Ingestion Workers
The UI has "Connect" buttons for tools like Google Drive, but they need background workers to be useful.
1. Complete the OAuth callback handlers (e.g., `src/routes/api/google/callback.ts`) to exchange authorization codes for refresh tokens and save them in the `user_integrations` table.
2. Build a background cron job (or queue system) that uses these refresh tokens to periodically download Google Drive docs, chunk the text, generate embeddings (via OpenAI `text-embedding-3-small` or Ollama `nomic-embed-text`), and insert them into the `documents` table.

### Step 3: Deployment Preparation
1. Deploy the TanStack Start frontend to Vercel or Netlify.
2. Switch `AI_PROVIDER` in the production `.env` to a cloud provider like `openai` or `gemini`, as hosting a local LLM online is complex.
3. Update Authorized Redirect URIs in Google Cloud/Slack developer consoles to match the live production URL.

---
**Note to Future AI:** The codebase strictly prefers using TanStack Start's `createServerFn` for backend logic rather than traditional REST API endpoints. Maintain the `shadcn/ui` aesthetic by utilizing existing Tailwind design tokens.
