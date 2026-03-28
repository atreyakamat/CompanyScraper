const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

chromium.use(stealth);

async function scrape(role = '', location = '', fileName = 'indeed_jobs.csv') {
  const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(role)}&l=${encodeURIComponent(location)}`;

  console.log(`[Indeed] Starting stealth scrape for: ${url}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let jobs = [];
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Indeed uses Cloudflare and other protections.
    await page.waitForSelector('td.resultContent', { timeout: 15000 }).catch(() => {
      console.log('[Indeed] No listings found or hit bot detection wall.');
    });

    jobs = await page.$$eval('td.resultContent', (elements) => {
      return elements.map(el => {
        const titleEl = el.querySelector('h2.jobTitle span');
        const companyEl = el.querySelector('[data-testid="company-name"]');
        const locationEl = el.querySelector('[data-testid="text-location"]');
        const linkEl = el.querySelector('h2.jobTitle a');

        return {
          title: titleEl ? titleEl.innerText.trim() : 'N/A',
          company: companyEl ? companyEl.innerText.trim() : 'N/A',
          location: locationEl ? locationEl.innerText.trim() : 'N/A',
          type: 'N/A', 
          date: 'N/A', 
          link: linkEl ? `https://in.indeed.com${linkEl.getAttribute('href')}` : 'N/A',
          email: 'N/A'
        };
      });
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
      console.log(`[Indeed] Success! Saved ${jobs.length} jobs to ${fileName}`);
    } else {
      console.log('[Indeed] No jobs found.');
    }
  } catch (err) {
    console.error(`[Indeed] Error: ${err.message}`);
  } finally {
    await browser.close();
  }
  
  return jobs;
}

module.exports = { scrape };
