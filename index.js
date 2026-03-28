const { Command } = require('commander');
const startupGoa = require('./scrapers/startupgoa');
const linkedin = require('./scrapers/linkedin');
const indeed = require('./scrapers/indeed');
const fs = require('fs');
const path = require('path');

const program = new Command();

// Try to load database module (might not exist before setup)
let db, profile, autoApply;
try {
  db = require('./db/database');
  profile = require('./profile/profile');
  autoApply = require('./apply/auto-apply');
} catch (e) {
  // Modules not created yet - setup.js needs to run
}

program
  .name('companyscraper')
  .description('AI-powered job scraper and auto-apply system')
  .version('3.0.0');

program
  .command('scrape')
  .description('Scrape job listings from a specific source')
  .requiredOption('-s, --source <source>', 'Source website (startupgoa, linkedin, indeed)')
  .option('-r, --role <role>', 'The job role to search for (e.g. "Software Developer")', 'Software Developer')
  .option('-l, --location <location>', 'The location to search in (e.g. "Pune", "Bangalore")', '')
  .option('-o, --output <filename>', 'Output filename', '')
  .option('--db', 'Save results to database (requires setup)', false)
  .action(async (options) => {
    const source = options.source.toLowerCase();
    const role = options.role;
    const location = options.location || '';
    const fileName = options.output || `${source}_${location || 'any'}_jobs.csv`;

    console.log(`Starting scrape for ${role} in ${location} via ${source}...`);
    
    let jobs = [];
    switch (source) {
      case 'startupgoa':
        jobs = await startupGoa.scrape(role, fileName);
        break;
      case 'linkedin':
        jobs = await linkedin.scrape(role, location, fileName);
        break;
      case 'indeed':
        jobs = await indeed.scrape(role, location, fileName);
        break;
      default:
        console.log(`Source "${source}" is not supported yet.`);
        return;
    }

    // Save to database if --db flag and db module exists
    if (options.db && db) {
      const inserted = db.insertJobs(jobs || [], source);
      console.log(`[DB] Saved ${inserted} new jobs to database`);
    }
  });

program
  .command('profile')
  .description('Set up or view your profile for auto-apply')
  .option('--view', 'Just view current profile')
  .action(async (options) => {
    if (!profile) {
      console.log('Run "node setup.js" first to set up the project.');
      return;
    }
    
    if (options.view) {
      profile.displayProfile();
    } else {
      await profile.interactiveSetup();
    }
  });

program
  .command('apply')
  .description('Auto-apply to jobs using AI')
  .option('-l, --limit <number>', 'Max jobs to apply to', '5')
  .option('--dry-run', 'Preview without submitting', false)
  .option('--headless', 'Run browser in headless mode', false)
  .action(async (options) => {
    if (!autoApply) {
      console.log('Run "node setup.js" first to set up the project.');
      return;
    }
    
    await autoApply.autoApplyBatch({
      limit: parseInt(options.limit, 10),
      dryRun: options.dryRun,
      headless: options.headless
    });
  });

program
  .command('jobs')
  .description('View scraped jobs in database')
  .option('-s, --status <status>', 'Filter by status (new, applied, rejected)', 'new')
  .option('-n, --limit <number>', 'Number of jobs to show', '20')
  .action(async (options) => {
    if (!db) {
      console.log('Run "node setup.js" first to set up the project.');
      return;
    }
    
    const jobs = options.status === 'new' 
      ? db.jobOps.getNew.all() 
      : db.jobOps.getAll.all();
    
    const limit = parseInt(options.limit, 10);
    const toShow = jobs.slice(0, limit);
    
    console.log(`\n📋 Jobs (${options.status}) - Showing ${toShow.length}/${jobs.length}\n`);
    
    toShow.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title}`);
      console.log(`   ${job.company} | ${job.location}`);
      console.log(`   ${job.source} | ${job.status}`);
      console.log('');
    });
    
    const stats = db.jobOps.count.get();
    const newCount = db.jobOps.countNew.get();
    console.log(`Total: ${stats.count} jobs | New: ${newCount.count} | Applied: ${stats.count - newCount.count}`);
  });

program
  .command('menu')
  .description('Interactive menu for common locations')
  .action(async () => {
    const locations = ['Pune', 'Hyderabad', 'Bengaluru'];
    const roles = ['Software Developer', 'Frontend Developer', 'Backend Developer'];
    
    console.log('--- Company Scraper Menu ---');
    console.log('Locations available:');
    locations.forEach((loc, i) => console.log(`${i + 1}. ${loc}`));
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ask = (query) => new Promise((resolve) => readline.question(query, resolve));

    const locIdx = await ask('Select location (number): ');
    const location = locations[parseInt(locIdx) - 1] || 'Pune';
    
    const roleIdx = await ask('Select role (1. Software, 2. Frontend, 3. Backend): ');
    const role = roles[parseInt(roleIdx) - 1] || 'Software Developer';

    readline.close();

    console.log(`Scraping for ${role} in ${location}...`);
    const fileName = `indeed_${location.toLowerCase()}_jobs.csv`;
    const jobs = await indeed.scrape(role, location, fileName);
    
    // Save to DB if available
    if (db && jobs) {
      const inserted = db.insertJobs(jobs, 'indeed');
      console.log(`[DB] Saved ${inserted} new jobs`);
    }
    
    console.log(`\nScraping complete. Results saved to ${fileName}.`);
  });

program
  .command('auto')
  .description('Fully automated scrape for all Indian cities')
  .option('-r, --role <role>', 'Role to search', 'Software Developer')
  .option('--db', 'Save to database', false)
  .action(async (options) => {
    const locations = ['Pune', 'Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Kolkata', 'Gurgaon', 'Noida'];
    const role = options.role;

    for (const loc of locations) {
      console.log(`\n[Auto] Processing ${loc}...`);
      const fileName = `indeed_${loc.toLowerCase()}_jobs.csv`;
      const jobs = await indeed.scrape(role, loc, fileName);
      
      if (options.db && db && jobs) {
        const inserted = db.insertJobs(jobs, 'indeed');
        console.log(`[DB] Saved ${inserted} jobs from ${loc}`);
      }
    }

    console.log('\n[Auto] All locations scraped.');
    
    if (db) {
      const stats = db.jobOps.countNew.get();
      console.log(`[DB] Total new jobs ready to apply: ${stats.count}`);
    }
  });

program.parse(process.argv);
