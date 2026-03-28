# CompanyScraper - Ecosystem Documentation

## Overview
CompanyScraper is an AI-powered job scraping and automated application system. It consists of a Node.js CLI tool, automated web scraping modules, an SQLite database for tracking applications and user profiles, an AI-powered automated application engine (using Ollama and Playwright), and a Next.js dashboard for visualizing job data.

## System Architecture

### 1. Node.js Command-Line Interface (CLI)
The main entry point for running tasks is `index.js`, built using `commander`.
**Commands:**
- `node index.js scrape`: Scrapes jobs from specified sources (LinkedIn, Indeed, StartupGoa).
- `node index.js profile`: Manages the user's profile and resume.
- `node index.js apply`: Runs the auto-apply engine on new jobs.
- `node index.js jobs`: Views stored jobs from the local database.
- `node index.js auto`: Fully automated scraping across Indian cities.

### 2. Scraping Engine
Found in `scrapers/`, this module connects to job boards to gather listings. 
- The data includes job title, company, location, and the direct application link.
- Supports sources: `startupgoa`, `linkedin`, `indeed`.
- Uses `axios`, `playwright`, and `puppeteer-extra-plugin-stealth` to bypass basic bot detections.

### 3. Database Layer (`db/database.js`)
Uses `better-sqlite3` to store state persistently in `data/jobs.db`.
- **Jobs Table:** Tracks scraped jobs and their status (`new`, `applied`, `rejected`).
- **Profile Table:** Stores user information (Name, Email, GitHub, Resume Path).
- **Applications Table:** Logs application attempts and timestamps.
- **AI Memory Table:** Saves user inputs provided during previous applications to prevent re-asking the same questions for identical form fields.

### 4. AI Auto-Apply Engine (`apply/auto-apply.js` & `agent/ollama-agent.js`)
A headless Playwright instance navigates to the job links.
- Uses `page.evaluate()` to identify all visible form elements.
- For standard fields (like email, name, LinkedIn), it directly maps to the user's `Profile`.
- For unknown fields, it relies on a local instance of **Ollama (`qwen3:0.6b` model)** to infer the correct context and generate answers.
- In `dry-run` mode, it provides mock defaults for form fields and evaluates them locally.
- Uploads the resume from `resume.pdf` automatically when an `<input type="file">` is found.

### 5. Next.js Dashboard
Located in `dashboard/`, this serves as the graphical user interface.
- Built with React 19, Next.js 16, Tailwind CSS, and Recharts.
- Reads data (via APIs or CSV parsing) to display insights such as application success rates, total jobs scraped, and more.

## Installation & Usage

### Pre-requisites
- Node.js (v20+)
- Python (for `better-sqlite3` node-gyp build tools)
- Ollama (installed locally with `qwen3:0.6b` model)

### Setup
```bash
node setup.js
```
This script creates all directories (`db/`, `agent/`, `apply/`), initializes the SQLite database, writes out the core module files, and triggers the Ollama model pull.

### Running Tasks
- **To Start Scraping:**
  `node index.js scrape -s startupgoa --db`
- **To Run Auto-Apply Dry Run (Detailed Testing):**
  `node index.js apply --limit 1 --dry-run --headless`
- **To Build the Next.js Dashboard:**
  `cd dashboard && npm run build`

## Detailed Testing Status
- The Next.js dashboard has been successfully compiled and pre-rendered statically.
- The `auto-apply` module has undergone highly detailed dry-run testing where Playwright correctly identified non-hidden fields, successfully attached a local `resume.pdf`, mapped basic inputs utilizing Ollama logic and user profile configs, and appropriately handled Checkbox interactions.
- The `better-sqlite3` native compilation issue typically found on Windows was successfully mitigated by updating the package to v12.8.0.

*Written by Gemini CLI.*