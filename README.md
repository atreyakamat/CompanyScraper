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
| `-o` | `--output` | Custom filename for CSV. | `"results.csv"` |

### Quick Example
```bash
node index.js scrape -s startupgoa -r "Data Analyst"
```

## Maintenance & Extension
To add more sites, create a new scraper in the `scrapers/` folder and register it in `index.js`. All new scrapers should ideally use the `stealth` plugin and `parseRelativeDate` utility for consistency.
