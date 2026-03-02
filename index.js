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
  .option('-o, --output <filename>', 'Output filename', '')
  .action(async (options) => {
    const source = options.source.toLowerCase();
    const role = options.role;
    const fileName = options.output || `${source}_jobs.csv`;

    switch (source) {
      case 'startupgoa':
        await startupGoa.scrape(role, fileName);
        break;
      case 'linkedin':
        console.log('[Notice] LinkedIn scraper is highly protected. Consider using a dedicated API for scale.');
        console.log('Generating Search URL:', `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}`);
        // We can add LinkedIn logic here as a next step
        break;
      case 'indeed':
        console.log('Generating Search URL:', `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}`);
        // We can add Indeed logic here as a next step
        break;
      default:
        console.log(`Source "${source}" is not supported yet.`);
    }
  });

program.parse(process.argv);
