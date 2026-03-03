const { Command } = require('commander');
const startupGoa = require('./scrapers/startupgoa');
const linkedin = require('./scrapers/linkedin');
const indeed = require('./scrapers/indeed');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('companyscraper')
  .description('A framework to scrape companies and jobs from different sources')
  .version('2.1.0');

program
  .command('scrape')
  .description('Scrape job listings from a specific source')
  .requiredOption('-s, --source <source>', 'Source website (startupgoa, linkedin, indeed)')
  .option('-r, --role <role>', 'The job role to search for (e.g. "Software Developer")', 'Software Developer')
  .option('-l, --location <location>', 'The location to search in (e.g. "Pune", "Bangalore")', '')
  .option('-o, --output <filename>', 'Output filename', '')
  .action(async (options) => {
    const source = options.source.toLowerCase();
    const role = options.role;
    const location = options.location || '';
    const fileName = options.output || `${source}_${location || 'any'}_jobs.csv`;

    console.log(`Starting scrape for ${role} in ${location} via ${source}...`);
    
    switch (source) {
      case 'startupgoa':
        await startupGoa.scrape(role, fileName);
        break;
      case 'linkedin':
        await linkedin.scrape(role, location, fileName);
        break;
      case 'indeed':
        await indeed.scrape(role, location, fileName);
        break;
      default:
        console.log(`Source "${source}" is not supported yet.`);
    }
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
    await indeed.scrape(role, location, fileName);
    
    console.log(`\nScraping complete. Results saved to ${fileName}.`);
    console.log('To find emails, please request Gemini CLI to "enrich the results".');
  });

program
  .command('auto')
  .description('Fully automated scrape for Pune, Hyderabad, and Bengaluru')
  .option('-r, --role <role>', 'Role to search', 'Software Developer')
  .action(async (options) => {
    const locations = ['Pune', 'Hyderabad', 'Bengaluru'];
    const role = options.role;

    for (const loc of locations) {
      console.log(`\n[Auto] Processing ${loc}...`);
      const fileName = `indeed_${loc.toLowerCase()}_jobs.csv`;
      await indeed.scrape(role, loc, fileName);
    }

    console.log('\n[Auto] All locations scraped.');
    console.log('Gemini CLI will now automatically fetch company details and emails.');
  });

program.parse(process.argv);
