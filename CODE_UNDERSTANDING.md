# Codebase Understanding Document

## Overview
CompanyScraper is an automated job scraping and auto-application ecosystem. The core functionality involves fetching job listings from websites like Indeed, LinkedIn, and StartupGoa, and then using an AI agent (Ollama with `qwen3:0.6b`) combined with Playwright to automatically fill out application forms based on the user's saved profile.

## Key Components

1. **CLI Engine (`index.js`)**: The main entry point utilizing `commander` to execute specific modules like `scrape`, `profile`, `apply`, `jobs`, and `auto`.
2. **Database (`db/database.js`)**: Uses `better-sqlite3` to store scraped job listings, user profiles, application history, and the AI's "memory" of previous interactions, ensuring persistence across sessions.
3. **Scrapers (`scrapers/`)**: Specialized scripts utilizing `axios` and `playwright` with stealth plugins to bypass simple bot detection, extracting key job data.
4. **AI Auto-Apply Engine (`apply/auto-apply.js` & `agent/ollama-agent.js`)**: This uses headless Playwright to navigate job pages. The engine tries to map user profile fields directly to form inputs. If it encounters unknown fields, it prompts the local Ollama instance to infer the correct input contextually and records the answers into the database to learn over time.
5. **Dashboard (`dashboard/`)**: A Next.js frontend to visualize scraping metrics and success rates.

## Build and Testing Notes
- **Testing**: A dry-run feature (`node index.js apply --dry-run`) provides an extensive mechanism for testing field mappings without making live submissions, heavily utilizing AI-based fallback for complex form fields.
- **Ecosystem**: Relies on a one-time `setup.js` to create necessary folders, database schemas, and pull the required Ollama model.
- **Stealth**: Playwright stealth plugins are explicitly configured to prevent immediate rejection by job portals' automated defenses.
