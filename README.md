# Company Scraper 3.0 - AI Auto-Apply Edition 🤖

A powerful job scraping platform with **AI-powered auto-apply** capabilities. Scrape jobs from Indeed, LinkedIn, and StartupGoa, store them in a database, and automatically apply using an Ollama-powered AI agent.

## 🚀 Key Features

### NEW in v3.0
- **🤖 AI Auto-Apply:** Automatically fill job application forms using Ollama AI (qwen3)
- **📊 SQLite Database:** Store and track all scraped jobs
- **👤 Profile Management:** Save your details once, apply to hundreds of jobs
- **🧠 Smart Form Filling:** AI learns from your inputs and remembers answers
- **📝 Application Tracking:** See which jobs you've applied to

### Existing Features
- **Stealth Scraping:** Advanced bot evasion using playwright-extra
- **Multi-Source:** Indeed, LinkedIn, StartupGoa support
- **Cron Scheduling:** Automated daily scrapes across all Indian cities
- **Dashboard:** Next.js visualization for market insights

## 📦 Quick Start

### 1. Setup (One-time)
```bash
# Run the setup script - creates all files and installs dependencies
node setup.js
```

This will:
- Create project directories (db/, profile/, agent/, apply/)
- Write all module files
- Install dependencies (better-sqlite3, axios)
- Check for Ollama and pull the AI model

### 2. Set Up Your Profile
```bash
node index.js profile
```
Enter your details: name, email, phone, skills, resume path, etc.

### 3. Scrape Jobs
```bash
# Single location
node index.js scrape -s indeed -l Bangalore --db

# All Indian cities (auto mode)
node index.js auto --db
```

### 4. Auto-Apply 🎯
```bash
# Apply to jobs using AI
node index.js apply

# Options
node index.js apply --limit 10      # Apply to 10 jobs
node index.js apply --dry-run       # Preview without submitting
node index.js apply --headless      # Run browser in background
```

## 🛠️ Commands Reference

| Command | Description |
|---------|-------------|
| `npm run setup` | Initial project setup |
| `npm run profile` | Set up your profile |
| `npm run scrape` | Scrape jobs |
| `npm run auto` | Scrape all Indian cities |
| `npm run apply` | Auto-apply to jobs |
| `npm run jobs` | View scraped jobs |
| `npm run scheduler` | Run cron scheduler |
| `npm run dashboard` | Launch web dashboard |

## 🤖 AI Agent (Ollama)

The auto-apply feature uses Ollama with the `qwen3:0.6b` model. 

### Install Ollama
1. Download from: https://ollama.ai
2. Run: `ollama pull qwen3:0.6b`
3. Start: `ollama serve`

The AI will:
- Map form fields to your profile data
- Ask you for unknown fields and remember answers
- Generate cover letters from your template

## ⚙️ Configuration

### config.json
```json
{
  "scheduler": {
    "enabled": true,
    "schedule": "0 9 * * *",
    "sources": [
      { "name": "indeed", "role": "Software Developer", "location": "Bangalore" },
      { "name": "indeed", "role": "Software Developer", "location": "Hyderabad" },
      { "name": "linkedin", "role": "Software Developer", "location": "Mumbai" }
    ]
  }
}
```

### Environment Variables
```bash
OLLAMA_URL=http://localhost:11434  # Ollama server URL
OLLAMA_MODEL=qwen3:0.6b            # AI model to use
```

## 📊 Database Schema

Jobs are stored in SQLite (`data/jobs.db`):
- `jobs` - Scraped job listings
- `user_profile` - Your profile data
- `applications` - Application history
- `ai_memory` - AI learned responses

## 🔍 Supported Sources

| Source | Status | Auto-Apply Support |
|--------|--------|-------------------|
| Indeed | ✅ Full | ✅ Yes |
| LinkedIn | ✅ Guest | ⚠️ Limited (login wall) |
| StartupGoa | ✅ Full | ✅ Yes |

## 📁 Project Structure

```
CompanyScraper/
├── index.js           # Main CLI
├── setup.js           # Setup script (run first!)
├── scheduler.js       # Cron job scheduler
├── config.json        # Configuration
├── scrapers/          # Job scrapers
│   ├── indeed.js
│   ├── linkedin.js
│   └── startupgoa.js
├── db/                # Database (created by setup)
│   └── database.js
├── profile/           # Profile management
│   └── profile.js
├── agent/             # AI agent
│   └── ollama-agent.js
├── apply/             # Auto-apply engine
│   └── auto-apply.js
└── data/              # SQLite database files
    └── jobs.db
```

## ⚠️ Important Notes

1. **Run setup.js first** - This creates all necessary files and directories
2. **Ollama must be running** for AI features: `ollama serve`
3. **Resume PDF** - Set your resume path in profile for auto-upload
4. **Review before submit** - Auto-apply asks for confirmation before submitting

## 🔒 Privacy

- All data stored locally in SQLite
- No data sent to external servers (except Ollama for AI)
- Profile data used only for form filling

## License
ISC
