const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { parseRelativeDate } = require('../utils/dateParser');

chromium.use(stealth);

async function scrape(role = '', fileName = 'startupgoa_jobs.csv') {
  const url = role 
    ? `https://startupgoa.org/jobs/?search_keywords=${encodeURIComponent(role)}`
    : 'https://startupgoa.org/jobs/#s=1';

  console.log(`[Startup Goa] Starting stealth scrape for: ${url}`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'] // Extra stealth
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.job_listings', { timeout: 15000 }).catch(() => console.log('No listings found.'));

    console.log('[Startup Goa] Loading all results...');
    let loadMoreExists = true;
    while (loadMoreExists) {
      const btn = await page.$('a.load_more_jobs');
      if (btn && await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(1500 + Math.random() * 1000); // Random delay to mimic human behavior
      } else {
        loadMoreExists = false;
      }
    }

    console.log('[Startup Goa] Extracting and cleaning data...');
    const rawJobs = await page.$$eval('.job_listing', (elements) => {
      return elements.map(el => ({
        title: el.querySelector('.position h3')?.innerText.trim() || 'N/A',
        company: el.querySelector('.company strong')?.innerText.trim() || 'N/A',
        location: el.querySelector('.location')?.innerText.trim() || 'N/A',
        type: el.querySelector('.job-type')?.innerText.trim() || 'N/A',
        date: el.querySelector('.date date')?.innerText.trim() || 'N/A',
        link: el.querySelector('.position a')?.href || 'N/A'
      }));
    });

    // Data Quality: Deduplication and Date Parsing
    const uniqueJobs = [];
    const seenLinks = new Set();

    for (const job of rawJobs) {
      if (!seenLinks.has(job.link)) {
        seenLinks.add(job.link);
        uniqueJobs.push({
          ...job,
          date: parseRelativeDate(job.date) // Use our new date parser
        });
      }
    }

    if (uniqueJobs.length > 0) {
      const csvWriter = createCsvWriter({
        path: fileName,
        header: [
          { id: 'title', title: 'Job Title' },
          { id: 'company', title: 'Company' },
          { id: 'location', title: 'Location' },
          { id: 'type', title: 'Job Type' },
          { id: 'date', title: 'Date Posted (Parsed)' },
          { id: 'link', title: 'Job Link' }
        ]
      });
      await csvWriter.writeRecords(uniqueJobs);
      console.log(`[Startup Goa] Success! Saved ${uniqueJobs.length} unique jobs to ${fileName}`);
    } else {
      console.log('[Startup Goa] No jobs found for this search.');
    }
  } finally {
    await browser.close();
  }
}

module.exports = { scrape };
