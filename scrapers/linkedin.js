const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

chromium.use(stealth);

async function scrape(role = '', location = '', fileName = 'linkedin_jobs.csv') {
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}&location=${encodeURIComponent(location)}`;

  console.log(`[LinkedIn] Starting stealth scrape for: ${url}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let jobs = [];
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // LinkedIn often shows a login wall for automated requests. 
    // If it does, we'll try to extract what's visible on the guest search page.
    await page.waitForSelector('.base-search-card', { timeout: 15000 }).catch(() => {
      console.log('[LinkedIn] No listings found or hit login wall.');
    });

    // Scroll a bit to load more (guest page has infinite scroll limit)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1000);
    }

    jobs = await page.$$eval('.base-search-card', (elements) => {
      return elements.map(el => ({
        title: el.querySelector('.base-search-card__title')?.innerText.trim() || 'N/A',
        company: el.querySelector('.base-search-card__subtitle a')?.innerText.trim() || 'N/A',
        location: el.querySelector('.job-search-card__location')?.innerText.trim() || 'N/A',
        type: 'N/A',
        date: el.querySelector('time')?.innerText.trim() || 'N/A',
        link: el.querySelector('.base-card__full-link')?.href || 'N/A',
        email: 'N/A'
      }));
    });

    if (jobs.length > 0) {
      const csvWriter = createCsvWriter({
        path: fileName,
        header: [
          { id: 'title', title: 'Job Title' },
          { id: 'company', title: 'Company' },
          { id: 'location', title: 'Location' },
          { id: 'type', title: 'Job Type' },
          { id: 'date', title: 'Date Posted' },
          { id: 'link', title: 'Job Link' },
          { id: 'email', title: 'Company Email' }
        ]
      });
      await csvWriter.writeRecords(jobs);
      console.log(`[LinkedIn] Success! Saved ${jobs.length} jobs to ${fileName}`);
    } else {
      console.log('[LinkedIn] No jobs found.');
    }
  } catch (err) {
    console.error(`[LinkedIn] Error: ${err.message}`);
  } finally {
    await browser.close();
  }
  
  return jobs;
}

module.exports = { scrape };
