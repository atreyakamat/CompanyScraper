# Company Scraper Framework 2.5 (Pro)

A modular, production-grade market intelligence platform for scraping, visualizing, and monitoring job and company data with high-end stealth and automation.

## 🚀 Pro Platform Features
- **Modern Dashboard:** Built with Next.js, Tailwind, and Recharts for real-time market visualization.
- **Automated Monitoring:** Background scheduler via `node-cron` to track markets like Bangalore, Pune, and Hyderabad daily.
- **Stealth Mode:** Advanced bot evasion using `playwright-extra` and stealth plugins.
- **Data Quality:** Automatic date parsing and duplicate filtering for clean lead generation.
- **Company Intelligence:** Captures company profile links for deep dive research.

## 🛠️ Installation & Setup

### 1. Local Environment
```bash
# Install core dependencies
npm install

# Install dashboard dependencies
cd dashboard && npm install && cd ..

# Install scraping browser
npx playwright install chromium
```

### 2. Docker
```bash
docker build -t companyscraper .
docker run -v ${PWD}:/usr/src/app companyscraper scrape -s startupgoa -r "Software Engineer"
```

## 🖥️ Running the Platform

### 📊 Launch the Intelligence Dashboard
Visualize your data, track top hiring locations, and search listings.
```bash
npm run dashboard
# Open http://localhost:3000
```

### 🕒 Start Automated Monitoring
Runs your pre-configured scrapes in the background based on `config.json`.
```bash
npm run scheduler
```

### 🔍 Manual CLI Scrapes
Use the command line for targeted, one-off searches.
```bash
# General Syntax
npm run scrape -- -s [source] -r "[role]" -l "[location]"

# Examples
npm run scrape -- -s linkedin -r "React Developer" -l "Pune"
npm run scrape -- -s indeed -r "Data Scientist" -l "Bangalore"
```

## ⚙️ Configuration (`config.json`)
Manage your automated monitoring toggles and search parameters:
```json
{
  "scheduler": {
    "enabled": true,
    "schedule": "0 9 * * *",
    "sources": [
      { "name": "indeed", "role": "Software Developer", "location": "Bangalore" },
      { "name": "indeed", "role": "Software Developer", "location": "Hyderabad" }
    ]
  }
}
```

## 🔍 Supported Sources Status

| Source | Status | Features |
|--------|--------|----------|
| **Startup Goa** | ✅ Fully Operational | Full expansion + Company Profile Links |
| **LinkedIn** | ✅ Operational (Guest) | Stealth public search (Pune, Bangalore, etc.) |
| **Indeed** | ✅ Operational | Indian Market specialization (in.indeed.com) |

## 🛠️ Developer Guide
1. **Adding Sources:** Create a script in `scrapers/`, implement `scrape(role, location, fileName)`, and register in `index.js`.
2. **Extending Dashboard:** Update `dashboard/src/app/page.tsx` for new charts or filter views.
