const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const startupGoa = require('./scrapers/startupgoa');
const indeed = require('./scrapers/indeed');
const linkedin = require('./scrapers/linkedin');

// Load config
const loadConfig = () => JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('[Scheduler] Loading Monitoring Service...');

const runJobs = async () => {
  const config = loadConfig();
  if (!config.scheduler.enabled) {
    console.log('[Scheduler] Service is disabled in config. Skipping...');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  console.log(`[Scheduler] Running scheduled scrapes at ${new Date().toISOString()}...`);
  
  for (const source of config.scheduler.sources) {
    const location = source.location || 'india';
    const fileName = path.join(outputDir, `${source.name}_${location.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.csv`);
    
    console.log(`[Scheduler] Starting: ${source.name} for ${source.role || 'All'} in ${location}...`);
    try {
      if (source.name === 'startupgoa') {
        await startupGoa.scrape(source.role, fileName);
      }
      if (source.name === 'indeed') {
        await indeed.scrape(source.role, source.location, fileName);
      }
      if (source.name === 'linkedin') {
        await linkedin.scrape(source.role, source.location, fileName);
      }
    } catch (err) {
      console.error(`[Scheduler] Error on ${source.name} (${location}):`, err.message);
    }
  }
  console.log('[Scheduler] All scheduled jobs completed.');
};

// Check for --run-now flag
const runNow = process.argv.includes('--run-now');

// Start the cron job
const config = loadConfig();
cron.schedule(config.scheduler.schedule, () => {
  runJobs();
});

console.log(`[Scheduler] Monitoring active! Cron schedule: ${config.scheduler.schedule}`);
console.log(`[Scheduler] Output directory: ${outputDir}`);

// Run immediately if --run-now flag is passed
if (runNow) {
  console.log('[Scheduler] --run-now flag detected. Starting immediate scrape...');
  runJobs();
}
