const { chromium } = require('playwright');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function scrape(role = '', fileName = 'startupgoa_jobs.csv') {
  const url = role 
    ? `https://startupgoa.org/jobs/?search_keywords=${encodeURIComponent(role)}`
    : 'https://startupgoa.org/jobs/#s=1';

  console.log(`[Startup Goa] Scraping role "${role || 'All'}" from ${url}`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.job_listings', { timeout: 10000 }).catch(() => console.log('No listings found.'));

    let loadMoreExists = true;
    while (loadMoreExists) {
      const btn = await page.$('a.load_more_jobs');
      if (btn && await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(1500);
      } else {
        loadMoreExists = false;
      }
    }

    const jobs = await page.$$eval('.job_listing', (elements) => {
      return elements.map(el => ({
        title: el.querySelector('.position h3')?.innerText.trim() || 'N/A',
        company: el.querySelector('.company strong')?.innerText.trim() || 'N/A',
        location: el.querySelector('.location')?.innerText.trim() || 'N/A',
        type: el.querySelector('.job-type')?.innerText.trim() || 'N/A',
        date: el.querySelector('.date date')?.innerText.trim() || 'N/A',
        link: el.querySelector('.position a')?.href || 'N/A'
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
          { id: 'link', title: 'Job Link' }
        ]
      });
      await csvWriter.writeRecords(jobs);
      console.log(`[Startup Goa] Success! Saved ${jobs.length} jobs to ${fileName}`);
    } else {
      console.log('[Startup Goa] No jobs found for this search.');
    }
  } finally {
    await browser.close();
  }
}

module.exports = { scrape };
