# Company Scraper Framework 2.0 (Pro)

A modular, production-grade CLI framework for scraping job and company data with stealth capabilities and Docker support.

## New Pro Features
- **Stealth Mode:** Uses `playwright-extra` and `stealth` plugins to evade bot detection.
- **Data Quality:** Automatically parses relative dates (e.g., "4 days ago" -> "2026-02-27") and removes duplicate listings.
- **Dockerized:** Run the scraper in any environment without installing Node or Playwright manually.

## Installation (Local)
```bash
npm install
npx playwright install chromium
```

## Docker Usage

### 1. Build the Image
```bash
docker build -t companyscraper .
```

### 2. Run the Scraper
The output CSV will be saved in the container. To get the file out, map a volume to your local machine:
```bash
# Windows (PowerShell)
docker run -v ${PWD}:/usr/src/app companyscraper scrape -s startupgoa -r "Software Engineer"
```

## Command Line Usage

| Flag | Name | Description | Example |
|------|------|-------------|---------|
| `-s` | `--source` | The website to scrape. | `startupgoa`, `linkedin`, `indeed` |
| `-r` | `--role`   | The job role or keywords. | `"Software Developer"` |
| `-l` | `--location`| The city or region. | `"Pune"`, `"Bangalore"` |
| `-o` | `--output` | Custom filename for CSV. | `"results.csv"` |

### Quick Examples
- **Startup Goa:** `node index.js scrape -s startupgoa -r "Software Engineer"`
- **LinkedIn (Pune):** `node index.js scrape -s linkedin -r "React Developer" -l "Pune"`
- **Indeed (Bangalore):** `node index.js scrape -s indeed -r "Data Analyst" -l "Bangalore"`

## Supported Sources Status

| Source | Status | Notes |
|--------|--------|-------|
| **Startup Goa** | ✅ Fully Operational | Scrapes all details including "Load More" expansion. |
| **LinkedIn** | ✅ Operational (Guest) | Scrapes public guest search. Limited by LinkedIn session walls. |
| **Indeed** | ✅ Operational | Scrapes India results (in.indeed.com). |

## Maintenance & Extension
To add more sites, create a new scraper in the `scrapers/` folder and register it in `index.js`. All new scrapers should ideally use the `stealth` plugin and `parseRelativeDate` utility for consistency.
