# Company Scraper Framework 2.0

A modular, extensible CLI framework for scraping job and company data from multiple sources like Startup Goa, LinkedIn, and Indeed.

## Prerequisites
- **Node.js**: (v16 or higher recommended)
- **NPM**: (comes with Node.js)

## Installation Guide

1. **Clone or copy the project files.**
2. **Install the required packages:**
   ```bash
   npm install
   ```
3. **Download the browser for scraping:**
   ```bash
   npx playwright install chromium
   ```

## Command Line Usage

The framework uses the `scrape` command with several flags:

| Flag | Name | Description | Example |
|------|------|-------------|---------|
| `-s` | `--source` | The website to scrape (Required). | `startupgoa`, `linkedin`, `indeed` |
| `-r` | `--role`   | The job role or keywords to search for. | `"Software Developer"`, `"Designer"` |
| `-o` | `--output` | Custom filename for the CSV output. | `"my_jobs.csv"` |

### Quick Examples

- **Scrape all jobs from Startup Goa:**
  ```bash
  node index.js scrape -s startupgoa
  ```

- **Scrape a specific role from Startup Goa and save to custom file:**
  ```bash
  node index.js scrape -s startupgoa -r "Product Manager" -o "pm_jobs.csv"
  ```

- **Generate search links for LinkedIn or Indeed:**
  ```bash
  node index.js scrape -s linkedin -r "React Developer"
  ```

## Supported Sources Status

| Source | Status | Notes |
|--------|--------|-------|
| **Startup Goa** | ✅ Fully Operational | Scrapes all details including "Load More" expansion. |
| **LinkedIn** | ⚠️ In Progress | Generates Search URL. Full scraping requires session handling due to high bot protection. |
| **Indeed** | ⚠️ In Progress | Generates Search URL. Requires cookie/session handling. |

## Developer Guide: Adding a New Source

The framework is designed to be easily expandable:

1.  **Create a scraper file**: Add a new file in the `scrapers/` folder (e.g., `scrapers/mywebsite.js`).
2.  **Implement logic**: Export a `scrape(role, fileName)` function that uses Playwright.
3.  **Register the source**: Open `index.js` and add your new source to the `switch` statement:
    ```javascript
    case 'mywebsite':
      await myWebsite.scrape(role, fileName);
      break;
    ```

## Maintenance & Updates
If a website changes its structure, you only need to update the specific file inside the `scrapers/` directory.
