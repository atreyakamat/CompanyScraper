const cron = require('node-cron');
const fs = require('fs');
const startupGoa = require('./scrapers/startupgoa');
const indeed = require('./scrapers/indeed');
const linkedin = require('./scrapers/linkedin');

// Load config
const loadConfig = () => JSON.parse(fs.readFileSync('./config.json', 'utf8'));

console.log('[Scheduler] Loading Monitoring Service...');

const runJobs = async () => {
  const config = loadConfig();
  if (!config.scheduler.enabled) {
    console.log('[Scheduler] Service is disabled in config. Skipping...');
    return;
  }

  console.log('[Scheduler] Running scheduled scrapes...');
  for (const source of config.scheduler.sources) {
    console.log(`[Scheduler] Starting: ${source.name} for ${source.role || 'All'}...`);
    try {
      if (source.name === 'startupgoa') await startupGoa.scrape(source.role);
      if (source.name === 'indeed') await indeed.scrape(source.role, source.location);
      if (source.name === 'linkedin') await linkedin.scrape(source.role, source.location);
    } catch (err) {
      console.error(`[Scheduler] Error on ${source.name}:`, err.message);
    }
  }
  console.log('[Scheduler] All scheduled jobs completed.');
};

// Start the cron job
const config = loadConfig();
cron.schedule(config.scheduler.schedule, () => {
  runJobs();
});

console.log(`[Scheduler] Monitoring active! Next run at: ${config.scheduler.schedule}`);

// Optional: Run immediately if you want to test
// runJobs();
