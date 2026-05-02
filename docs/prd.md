# Product Requirements Document (PRD): Local Lead Management Platform

## 1. Overview
The Lead Management Platform is a locally-hosted tool designed to aggregate, categorize, and manage leads from various sources (e.g., LinkedIn, Emails). It features an integrated local AI assistant (powered by Ollama) to help sort leads and draft replies.

## 2. Core Objectives
- **Centralized Ingestion:** Provide an endpoint/interface to source leads from LinkedIn and Emails into one central repository.
- **Categorization:** Allow the user to tag leads and associate them with different businesses or campaigns.
- **Lead Management Dashboard:** View, filter, and track the status of leads.
- **Integrated Communication:** Enable the user to draft and send replies directly from the platform.
- **Local Privacy:** Run entirely locally using an SQLite database and Ollama for AI tasks to ensure complete data privacy.

## 3. Key Features
1. **Lead Inbox:** A unified view of all incoming leads.
2. **Business & Tag Management:** Create businesses and custom tags to categorize leads.
3. **Smart AI Assistant (Ollama):** 
   - Suggests tags based on the lead's profile/message.
   - Drafts contextual email/LinkedIn replies.
4. **Action Center:** Track communication history and status (New, Contacted, Replied, Closed).
5. **REST API for Sourcing:** Endpoints that allow external scripts (like LinkedIn scrapers or Email forwarders) to push new leads to the platform.

## 4. User Flow
1. User sets up businesses and custom tags.
2. External sources (or manual entry) push leads to the platform.
3. User opens the dashboard, sees new leads.
4. User clicks on a lead, reviews the AI-suggested tags, and confirms them.
5. User clicks "Draft Reply", the Ollama agent generates a response.
6. User edits and sends the reply (updates status to 'Contacted').

## 5. Non-Functional Requirements
- **Performance:** Instant loading from local SQLite.
- **Security:** Local-only execution, no external cloud dependencies except for standard NPM packages.
- **Design:** Modern, clean, and responsive UI using vanilla CSS.
