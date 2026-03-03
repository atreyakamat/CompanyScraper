# Company Scraper Framework 2.6 (Intelligence Edition)

A modular, production-grade market intelligence platform for scraping, visualizing, and monitoring job and company data with high-end stealth and automation. Now featuring **Intelligent Email Fetching**.

## 🚀 Pro Platform Features
- **Intelligent Email Fetching:** Automatically finds and enriches company contact details using AI-driven search.
- **Automated City Scrapes:** One-click automation for primary hubs (Pune, Hyderabad, Bengaluru).
- **Interactive Menu:** Quick-access CLI menu for selecting roles and locations.
- **Modern Dashboard:** Built with Next.js, Tailwind, and Recharts for real-time market visualization.
- **Stealth Mode:** Advanced bot evasion using `playwright-extra` and stealth plugins.
- **Data Quality:** Automatic date parsing and deduplication for clean lead generation.

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
docker run -v ${PWD}:/usr/src/app companyscraper auto
```

## 🖥️ Running the Platform

### 🤖 Automated Scrape & Intelligence (New)
Run the fully automated cycle for Pune, Hyderabad, and Bengaluru.
```bash
node index.js auto --role "Software Developer"
```

### 📱 Interactive Menu (New)
Select from common locations and roles via a guided CLI interface.
```bash
node index.js menu
```

### 📊 Launch the Intelligence Dashboard
Visualize your data, track top hiring locations, and search listings.
```bash
npm run dashboard
# Open http://localhost:3000
```

### 🔍 Manual CLI Scrapes
```bash
# General Syntax
node index.js scrape -s [source] -r "[role]" -l "[location]"

# Examples
node index.js scrape -s indeed -r "Frontend Developer" -l "Pune"
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
| **Indeed** | ✅ Fully Operational | Indian Market specialization + Email Fetching |
| **Startup Goa** | ✅ Fully Operational | Full expansion + Company Profile Links |
| **LinkedIn** | ✅ Operational (Guest) | Stealth public search (Pune, Bangalore, etc.) |

## 🛠️ Developer Guide
1. **Adding Sources:** Create a script in `scrapers/`, implement `scrape(role, location, fileName)`, and register in `index.js`.
2. **Email Intelligence:** The `email` field is populated by the intelligence layer; ensure your scraper includes this field in the CSV header.
