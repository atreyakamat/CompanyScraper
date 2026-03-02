const { Command } = require('commander');
const startupGoa = require('./scrapers/startupgoa');

const program = new Command();

program
  .name('companyscraper')
  .description('A framework to scrape companies and jobs from different sources')
  .version('2.0.0');

program
  .command('scrape')
  .description('Scrape job listings from a specific source')
  .requiredOption('-s, --source <source>', 'Source website (startupgoa, linkedin, indeed)')
  .option('-r, --role <role>', 'The job role to search for (e.g. "Software Developer")', '')
  .option('-l, --location <location>', 'The location to search in (e.g. "Pune", "Bangalore")', '')
  .option('-o, --output <filename>', 'Output filename', '')
  .action(async (options) => {
    const source = options.source.toLowerCase();
    const role = options.role;
    const location = options.location || '';
    const fileName = options.output || `${source}_jobs.csv`;

    switch (source) {
      case 'startupgoa':
        await startupGoa.scrape(role, fileName);
        break;
      case 'linkedin':
        const linkedin = require('./scrapers/linkedin');
        await linkedin.scrape(role, location, fileName);
        break;
      case 'indeed':
        const indeed = require('./scrapers/indeed');
        await indeed.scrape(role, location, fileName);
        break;
      default:
        console.log(`Source "${source}" is not supported yet.`);
    }
  });

program.parse(process.argv);
