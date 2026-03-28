const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const readline = require('readline');
const { analyzeFormField, generateCoverLetter, rememberAnswer, recallAnswer, checkOllama } = require('../agent/ollama-agent');
const { getProfile, getFieldValue } = require('../profile/profile');
const { jobOps, applicationOps } = require('../db/database');

chromium.use(stealth);

async function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(`\n❓ ${question}: `, ans => { rl.close(); r(ans); }));
}

async function fillField(page, field, profile, options = {}) {
  const { name, type, id, placeholder } = field;
  const selector = id ? `#${id}` : `[name="${name}"]`;
  
  try {
    const el = await page.$(selector);
    if (!el) return false;
    
    const label = await page.evaluate(s => {
      const el = document.querySelector(s);
      const label = el?.labels?.[0]?.textContent || el?.placeholder || '';
      return label.trim();
    }, selector);

    // Skip if it's already filled or not actionable
    if (type === 'hidden') return false;

    // Check AI memory first
    const remembered = await recallAnswer(label || name);
    if (remembered) {
      if (type === 'checkbox') {
        if (remembered === 'true' || remembered === 'y' || remembered === 'yes') await el.check();
      } else {
        await el.fill(remembered);
      }
      console.log(`  ✓ ${name}: ${remembered} (remembered)`);
      return true;
    }

    // Try profile mapping
    const result = await analyzeFormField({ name, type, label, placeholder });
    
    if (result.value) {
      if (type === 'file') {
        await el.setInputFiles(result.value);
      } else if (type === 'checkbox') {
        await el.check();
      } else {
        await el.fill(String(result.value));
      }
      console.log(`  ✓ ${name}: ${result.value} (${result.source})`);
      return true;
    }
    
    // In dry run, don't block for input
    if (options.dryRun) {
      const defaultVal = type === 'checkbox' ? 'true' : 'N/A';
      if (type === 'checkbox') {
        try { await el.check(); } catch(e) {}
      } else {
        try { await el.fill(defaultVal); } catch(e) {}
      }
      console.log(`  ✓ ${name}: ${defaultVal} (dry-run default)`);
      return true;
    }

    // Need user input
    const userValue = await askUser(`Enter value for "${label || name}"`);
    if (userValue) {
      if (type === 'checkbox') {
        if (userValue.toLowerCase() === 'y' || userValue.toLowerCase() === 'yes') await el.check();
      } else {
        await el.fill(userValue);
      }
      await rememberAnswer(label || name, userValue, 'form_field');
      console.log(`  ✓ ${name}: ${userValue} (user + saved)`);
      return true;
    }
    
    return false;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    return false;
  }
}

async function applyToJob(job, options = {}) {
  const profile = getProfile();
  if (!profile?.email) {
    console.error('Profile not set. Run: node index.js profile');
    return { success: false, error: 'no_profile' };
  }

  console.log(`\n🎯 Applying to: ${job.title} at ${job.company}`);
  console.log(`   Link: ${job.job_link}`);

  const browser = await chromium.launch({ 
    headless: options.headless ?? false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    await page.goto(job.job_link, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Look for apply button
    const applyBtn = await page.$('button:has-text("Apply"), a:has-text("Apply"), [class*="apply"]');
    if (applyBtn) {
      await applyBtn.click();
      await page.waitForTimeout(2000);
    }

    // Find all form fields
    const fields = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      return Array.from(inputs).map(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          name: el.name || el.id,
          type: el.type,
          id: el.id,
          placeholder: el.placeholder,
          required: el.required,
          visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
        };
      }).filter(f => f.name && f.visible && f.type !== 'hidden');
    });

    console.log(`\n📝 Found ${fields.length} form fields`);

    for (const field of fields) {
      await fillField(page, field, profile, options);
    }

    // Handle file uploads (resume)
    const fileInputs = await page.$$('input[type="file"]');
    for (const input of fileInputs) {
      if (profile.resume_path) {
        try {
          await input.setInputFiles(profile.resume_path);
          console.log('  ✓ Resume uploaded');
        } catch (e) {
          console.log('  ⚠ Could not upload resume');
        }
      }
    }

    // Look for submit button
    if (!options.dryRun) {
      const confirmed = await askUser('Review the form. Submit? (y/n)');
      if (confirmed.toLowerCase() === 'y') {
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit")');
        if (submitBtn) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
          console.log('\n✅ Application submitted!');
          
          // Record in DB
          jobOps.markApplied.run(job.id);
          applicationOps.insert.run({ job_id: job.id, status: 'applied', notes: 'Auto-applied' });
          
          return { success: true };
        }
      }
    } else {
      console.log('\n[DRY RUN] Would submit here');
    }

    return { success: false, error: 'no_submit' };
  } catch (e) {
    console.error('Error:', e.message);
    return { success: false, error: e.message };
  } finally {
    if (!options.keepOpen) await browser.close();
  }
}

async function autoApplyBatch(options = {}) {
  const ollamaOk = await checkOllama();
  if (!ollamaOk) {
    console.log('\n⚠ Ollama not running. Form filling will be limited to profile data.');
  }

  const jobs = jobOps.getNew.all();
  console.log(`\n📋 Found ${jobs.length} new jobs to apply`);
  
  if (jobs.length === 0) {
    console.log('No new jobs. Run scraper first: node index.js scrape -s indeed -l Bangalore');
    return;
  }

  const limit = options.limit || 5;
  const toApply = jobs.slice(0, limit);
  
  console.log(`\nWill apply to ${toApply.length} jobs (limit: ${limit})`);
  
  for (let i = 0; i < toApply.length; i++) {
    console.log(`\n[${i + 1}/${toApply.length}]`);
    await applyToJob(toApply[i], options);
    
    if (i < toApply.length - 1) {
      const cont = await askUser('Continue to next job? (y/n)');
      if (cont.toLowerCase() !== 'y') break;
    }
  }
  
  console.log('\n🎉 Auto-apply session complete!');
}

module.exports = { applyToJob, autoApplyBatch, fillField };
