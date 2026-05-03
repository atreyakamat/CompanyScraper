# Architecture & Implementation Plan

## 1. Database Schema (SQLite)

- **Businesses Table:**
  - `id`, `name`, `description`, `created_at`
- **Tags Table:**
  - `id`, `name`, `color`, `created_at`
- **Leads Table:**
  - `id`, `name`, `source` (LinkedIn, Email, Manual), `contact_info` (email/url), `message_context`, `status` (New, Contacted, Converted, Lost), `business_id`, `created_at`
- **LeadTags Table (Many-to-Many):**
  - `lead_id`, `tag_id`

## 2. API Routes
- `POST /api/leads/ingest`: Endpoint to receive leads from external sources.
- `GET /api/leads`: Fetch and filter leads.
- `POST /api/ai/draft-reply`: Calls Ollama with lead context to generate a message.
- `POST /api/ai/suggest-tags`: Calls Ollama to suggest tags based on the message.

## 3. UI Components
- **Sidebar:** Navigation (Dashboard, Businesses, Tags, Settings).
- **Lead Table/Kanban:** Displays leads by status.
- **Lead Detail Modal:** Shows full context, tags, and an AI chat interface to draft replies.
- **Settings:** Configure Ollama model (e.g., `llama3` or `qwen3:0.6b`).

## 4. Implementation Steps
1. **Initialize Next.js Project:** Setup basic structure.
2. **Setup Database:** Create schema and seed script using SQLite.
3. **Build API Layer:** Implement CRUD for businesses, tags, and leads.
4. **Build Ingestion Webhook:** Implement `/api/leads/ingest`.
5. **Integrate Ollama:** Build the AI wrapper service.
6. **Develop UI:** Build the Dashboard, Lead Details, and Business Management pages.
7. **End-to-End Testing:** Verify ingestion, AI processing, and state updates.