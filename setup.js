// Setup script - creates all necessary directories, files, and installs dependencies
// Run this first: node setup.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirs = ['db', 'profile', 'agent', 'apply', 'data', 'output'];

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║    🚀 CompanyScraper Auto-Apply Setup             ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

// 1. Create directories
console.log('[1/5] Creating project directories...');
for (const dir of dirs) {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ Created ${dir}/`);
  } else {
    console.log(`  - ${dir}/ exists`);
  }
}

// 2. Write source files
console.log('\n[2/5] Writing module files...');

// database.js
const databaseCode = `const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'jobs.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.error('[DB] Error:', err.message);
  console.log('[DB] Run "node setup.js" first');
  process.exit(1);
}

db.exec(\`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL, company TEXT NOT NULL, location TEXT,
    job_type TEXT, date_posted TEXT, job_link TEXT UNIQUE,
    source TEXT, description TEXT, company_email TEXT, salary TEXT,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    applied INTEGER DEFAULT 0, applied_at DATETIME, status TEXT DEFAULT 'new'
  );
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    full_name TEXT, email TEXT, phone TEXT, linkedin_url TEXT,
    github_url TEXT, portfolio_url TEXT, current_title TEXT,
    years_experience INTEGER, skills TEXT, education TEXT,
    work_experience TEXT, resume_path TEXT, cover_letter_template TEXT,
    preferred_locations TEXT, preferred_job_types TEXT, min_salary INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'applied', notes TEXT,
    response_received INTEGER DEFAULT 0, response_date DATETIME,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );
  CREATE TABLE IF NOT EXISTS ai_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT, answer TEXT, context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_applied ON jobs(applied);
\`);

const jobOps = {
  insert: db.prepare(\`INSERT OR IGNORE INTO jobs (title, company, location, job_type, date_posted, job_link, source, description, company_email, salary) VALUES (@title, @company, @location, @job_type, @date_posted, @job_link, @source, @description, @company_email, @salary)\`),
  getAll: db.prepare('SELECT * FROM jobs ORDER BY scraped_at DESC'),
  getNew: db.prepare('SELECT * FROM jobs WHERE applied = 0 AND status = "new" ORDER BY scraped_at DESC'),
  getById: db.prepare('SELECT * FROM jobs WHERE id = ?'),
  markApplied: db.prepare('UPDATE jobs SET applied = 1, applied_at = CURRENT_TIMESTAMP, status = "applied" WHERE id = ?'),
  count: db.prepare('SELECT COUNT(*) as count FROM jobs'),
  countNew: db.prepare('SELECT COUNT(*) as count FROM jobs WHERE applied = 0 AND status = "new"'),
};

const profileOps = {
  get: db.prepare('SELECT * FROM user_profile WHERE id = 1'),
  upsert: db.prepare(\`INSERT INTO user_profile (id, full_name, email, phone, linkedin_url, github_url, portfolio_url, current_title, years_experience, skills, education, work_experience, resume_path, cover_letter_template, preferred_locations, preferred_job_types, min_salary, updated_at) VALUES (1, @full_name, @email, @phone, @linkedin_url, @github_url, @portfolio_url, @current_title, @years_experience, @skills, @education, @work_experience, @resume_path, @cover_letter_template, @preferred_locations, @preferred_job_types, @min_salary, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET full_name=@full_name, email=@email, phone=@phone, linkedin_url=@linkedin_url, github_url=@github_url, portfolio_url=@portfolio_url, current_title=@current_title, years_experience=@years_experience, skills=@skills, education=@education, work_experience=@work_experience, resume_path=@resume_path, cover_letter_template=@cover_letter_template, preferred_locations=@preferred_locations, preferred_job_types=@preferred_job_types, min_salary=@min_salary, updated_at=CURRENT_TIMESTAMP\`),
};

const applicationOps = {
  insert: db.prepare('INSERT INTO applications (job_id, status, notes) VALUES (@job_id, @status, @notes)'),
  getAll: db.prepare('SELECT a.*, j.title, j.company FROM applications a JOIN jobs j ON a.job_id = j.id ORDER BY a.applied_at DESC'),
};

const aiMemoryOps = {
  insert: db.prepare('INSERT INTO ai_memory (question, answer, context) VALUES (@question, @answer, @context)'),
  search: db.prepare('SELECT answer FROM ai_memory WHERE question LIKE ? ORDER BY created_at DESC LIMIT 1'),
  getAll: db.prepare('SELECT * FROM ai_memory ORDER BY created_at DESC LIMIT 100'),
};

function insertJobs(jobs, source) {
  const insert = db.transaction((jobsList) => {
    let inserted = 0;
    for (const job of jobsList) {
      try {
        jobOps.insert.run({
          title: job.title || 'N/A', company: job.company || 'N/A', location: job.location || 'N/A',
          job_type: job.type || job.job_type || 'N/A', date_posted: job.date || 'N/A',
          job_link: job.link || '', source, description: job.description || '',
          company_email: job.email || 'N/A', salary: job.salary || 'N/A'
        });
        inserted++;
      } catch (e) {}
    }
    return inserted;
  });
  return insert(jobs);
}

module.exports = { db, jobOps, profileOps, applicationOps, aiMemoryOps, insertJobs };
`;
fs.writeFileSync(path.join(__dirname, 'db', 'database.js'), databaseCode);
console.log('  ✓ db/database.js');

// profile.js
const profileCode = `const readline = require('readline');
let db; try { db = require('../db/database'); } catch(e) { console.error('Run setup.js first'); process.exit(1); }
const { profileOps } = db;

const FIELDS = [
  { key: 'full_name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: true },
  { key: 'linkedin_url', label: 'LinkedIn URL' },
  { key: 'github_url', label: 'GitHub URL' },
  { key: 'portfolio_url', label: 'Portfolio URL' },
  { key: 'current_title', label: 'Current Job Title', required: true },
  { key: 'years_experience', label: 'Years Experience', type: 'number' },
  { key: 'skills', label: 'Skills (comma-sep)' },
  { key: 'education', label: 'Education' },
  { key: 'work_experience', label: 'Work Experience' },
  { key: 'resume_path', label: 'Resume PDF Path' },
  { key: 'preferred_locations', label: 'Preferred Locations' },
  { key: 'min_salary', label: 'Min Salary (LPA)', type: 'number' },
];

function getProfile() { return profileOps.get.get(); }

function saveProfile(data) {
  const p = {};
  FIELDS.forEach(f => p[f.key] = data[f.key] || null);
  p.cover_letter_template = data.cover_letter_template || null;
  p.preferred_job_types = data.preferred_job_types || null;
  profileOps.upsert.run(p);
  return p;
}

async function interactiveSetup() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(q, r));
  
  console.log('\\n📋 Profile Setup for Auto-Apply\\n');
  const existing = getProfile() || {};
  const profile = {};
  
  for (const f of FIELDS) {
    const hint = existing[f.key] ? \` [\${existing[f.key]}]\` : '';
    let val = await ask(\`\${f.label}\${f.required ? '*' : ''}\${hint}: \`);
    if (!val && existing[f.key]) val = existing[f.key];
    if (f.type === 'number' && val) val = parseInt(val, 10);
    profile[f.key] = val || null;
  }
  
  profile.cover_letter_template = await ask('Cover Letter Template: ') || existing.cover_letter_template || 
    'Dear Hiring Manager, I am excited to apply for this position. Best regards, {name}';
  
  rl.close();
  saveProfile(profile);
  console.log('\\n✅ Profile saved!');
  displayProfile(profile);
  return profile;
}

function displayProfile(p) {
  p = p || getProfile();
  if (!p) { console.log('No profile. Run: node index.js profile'); return; }
  console.log('\\n┌─── Your Profile ───┐');
  console.log(\`│ Name: \${p.full_name || '-'}\`);
  console.log(\`│ Email: \${p.email || '-'}\`);
  console.log(\`│ Phone: \${p.phone || '-'}\`);
  console.log(\`│ Title: \${p.current_title || '-'}\`);
  console.log(\`│ Skills: \${p.skills || '-'}\`);
  console.log('└────────────────────┘');
}

function getFieldValue(fieldName) {
  const p = getProfile();
  if (!p) return null;
  const fn = fieldName.toLowerCase();
  const map = {
    'name': p.full_name, 'fullname': p.full_name, 'full_name': p.full_name,
    'firstname': p.full_name?.split(' ')[0], 'first_name': p.full_name?.split(' ')[0],
    'lastname': p.full_name?.split(' ').slice(1).join(' '),
    'email': p.email, 'mail': p.email,
    'phone': p.phone, 'mobile': p.phone, 'telephone': p.phone,
    'linkedin': p.linkedin_url, 'github': p.github_url,
    'portfolio': p.portfolio_url, 'website': p.portfolio_url,
    'title': p.current_title, 'experience': p.years_experience,
    'skills': p.skills, 'education': p.education, 'salary': p.min_salary,
  };
  for (const [k, v] of Object.entries(map)) if (fn.includes(k)) return v;
  return null;
}

module.exports = { getProfile, saveProfile, interactiveSetup, displayProfile, getFieldValue, FIELDS };
`;
fs.writeFileSync(path.join(__dirname, 'profile', 'profile.js'), profileCode);
console.log('  ✓ profile/profile.js');

// ollama-agent.js
const agentCode = `const axios = require('axios');
let db; try { db = require('../db/database'); } catch(e) {}
const { getProfile, getFieldValue } = require('../profile/profile');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';

async function checkOllama() {
  try {
    await axios.get(\`\${OLLAMA_URL}/api/tags\`);
    return true;
  } catch (e) {
    console.error('[AI] Ollama not running. Start with: ollama serve');
    return false;
  }
}

async function chat(prompt, context = '') {
  const systemPrompt = \`You are a helpful assistant that helps fill job application forms.
You have access to the user's profile. Answer concisely and accurately.
If you don't know the answer, say "NEED_INPUT" and the user will provide it.\`;

  try {
    const res = await axios.post(\`\${OLLAMA_URL}/api/generate\`, {
      model: MODEL,
      prompt: \`\${systemPrompt}\\n\\nContext: \${context}\\n\\nUser: \${prompt}\`,
      stream: false,
      options: { temperature: 0.3, num_predict: 200 }
    });
    return res.data.response.trim();
  } catch (e) {
    console.error('[AI] Error:', e.message);
    return null;
  }
}

async function analyzeFormField(fieldInfo) {
  const { name, type, label, placeholder } = fieldInfo;
  const profile = getProfile();
  
  // Try direct mapping first
  const directValue = getFieldValue(name) || getFieldValue(label || '');
  if (directValue) return { value: directValue, source: 'profile', confidence: 1.0 };
  
  // Use AI for complex fields
  const prompt = \`Form field: name="\${name}", type="\${type}", label="\${label || ''}", placeholder="\${placeholder || ''}".
User profile: \${JSON.stringify(profile, null, 2)}
What value should be entered? Return ONLY the value, nothing else.\`;

  const aiResponse = await chat(prompt);
  if (aiResponse && !aiResponse.includes('NEED_INPUT')) {
    return { value: aiResponse, source: 'ai', confidence: 0.8 };
  }
  
  return { value: null, source: 'user_input_needed', confidence: 0, field: label || name };
}

async function generateCoverLetter(jobTitle, company) {
  const profile = getProfile();
  if (!profile) return null;
  
  const template = profile.cover_letter_template || 
    'Dear Hiring Manager, I am applying for {role} at {company}. Best, {name}';
  
  return template
    .replace(/{role}/g, jobTitle)
    .replace(/{company}/g, company)
    .replace(/{name}/g, profile.full_name || 'Applicant');
}

async function rememberAnswer(question, answer, context = '') {
  if (db?.aiMemoryOps) {
    db.aiMemoryOps.insert.run({ question, answer, context });
  }
}

async function recallAnswer(question) {
  if (db?.aiMemoryOps) {
    const result = db.aiMemoryOps.search.get(\`%\${question}%\`);
    return result?.answer || null;
  }
  return null;
}

module.exports = { checkOllama, chat, analyzeFormField, generateCoverLetter, rememberAnswer, recallAnswer, OLLAMA_URL, MODEL };
`;
fs.writeFileSync(path.join(__dirname, 'agent', 'ollama-agent.js'), agentCode);
console.log('  ✓ agent/ollama-agent.js');

// auto-apply.js
const applyCode = `const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const readline = require('readline');
const { analyzeFormField, generateCoverLetter, rememberAnswer, recallAnswer, checkOllama } = require('../agent/ollama-agent');
const { getProfile, getFieldValue } = require('../profile/profile');
const { jobOps, applicationOps } = require('../db/database');

chromium.use(stealth);

async function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(\`\\n❓ \${question}: \`, ans => { rl.close(); r(ans); }));
}

async function fillField(page, field, profile) {
  const { name, type, id, placeholder } = field;
  const selector = id ? \`#\${id}\` : \`[name="\${name}"]\`;
  
  try {
    const el = await page.$(selector);
    if (!el) return false;
    
    const label = await page.evaluate(s => {
      const el = document.querySelector(s);
      const label = el?.labels?.[0]?.textContent || el?.placeholder || '';
      return label.trim();
    }, selector);

    // Check AI memory first
    const remembered = await recallAnswer(label || name);
    if (remembered) {
      await el.fill(remembered);
      console.log(\`  ✓ \${name}: \${remembered} (remembered)\`);
      return true;
    }

    // Try profile mapping
    const result = await analyzeFormField({ name, type, label, placeholder });
    
    if (result.value) {
      if (type === 'file' && result.value) {
        await el.setInputFiles(result.value);
      } else {
        await el.fill(String(result.value));
      }
      console.log(\`  ✓ \${name}: \${result.value} (\${result.source})\`);
      return true;
    }
    
    // Need user input
    const userValue = await askUser(\`Enter value for "\${label || name}"\`);
    if (userValue) {
      await el.fill(userValue);
      await rememberAnswer(label || name, userValue, 'form_field');
      console.log(\`  ✓ \${name}: \${userValue} (user + saved)\`);
      return true;
    }
    
    return false;
  } catch (e) {
    console.error(\`  ✗ \${name}: \${e.message}\`);
    return false;
  }
}

async function applyToJob(job, options = {}) {
  const profile = getProfile();
  if (!profile?.email) {
    console.error('Profile not set. Run: node index.js profile');
    return { success: false, error: 'no_profile' };
  }

  console.log(\`\\n🎯 Applying to: \${job.title} at \${job.company}\`);
  console.log(\`   Link: \${job.job_link}\`);

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
      return Array.from(inputs).map(el => ({
        name: el.name || el.id,
        type: el.type,
        id: el.id,
        placeholder: el.placeholder,
        required: el.required
      })).filter(f => f.name);
    });

    console.log(\`\\n📝 Found \${fields.length} form fields\`);

    for (const field of fields) {
      await fillField(page, field, profile);
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
          console.log('\\n✅ Application submitted!');
          
          // Record in DB
          jobOps.markApplied.run(job.id);
          applicationOps.insert.run({ job_id: job.id, status: 'applied', notes: 'Auto-applied' });
          
          return { success: true };
        }
      }
    } else {
      console.log('\\n[DRY RUN] Would submit here');
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
    console.log('\\n⚠ Ollama not running. Form filling will be limited to profile data.');
  }

  const jobs = jobOps.getNew.all();
  console.log(\`\\n📋 Found \${jobs.length} new jobs to apply\`);
  
  if (jobs.length === 0) {
    console.log('No new jobs. Run scraper first: node index.js scrape -s indeed -l Bangalore');
    return;
  }

  const limit = options.limit || 5;
  const toApply = jobs.slice(0, limit);
  
  console.log(\`\\nWill apply to \${toApply.length} jobs (limit: \${limit})\`);
  
  for (let i = 0; i < toApply.length; i++) {
    console.log(\`\\n[\${i + 1}/\${toApply.length}]\`);
    await applyToJob(toApply[i], options);
    
    if (i < toApply.length - 1) {
      const cont = await askUser('Continue to next job? (y/n)');
      if (cont.toLowerCase() !== 'y') break;
    }
  }
  
  console.log('\\n🎉 Auto-apply session complete!');
}

module.exports = { applyToJob, autoApplyBatch, fillField };
`;
fs.writeFileSync(path.join(__dirname, 'apply', 'auto-apply.js'), applyCode);
console.log('  ✓ apply/auto-apply.js');

// 3. Install dependencies
console.log('\n[3/5] Installing dependencies...');
try {
  execSync('npm install better-sqlite3 axios', { stdio: 'inherit', cwd: __dirname });
  console.log('  ✓ Dependencies installed');
} catch (err) {
  console.error('  ⚠ Manual install needed: npm install better-sqlite3 axios');
}

// 4. Check Ollama
console.log('\n[4/5] Checking Ollama...');
let ollamaInstalled = false;
try {
  execSync('ollama --version', { stdio: 'pipe' });
  ollamaInstalled = true;
  console.log('  ✓ Ollama is installed');
} catch (err) {
  console.log('  ⚠ Ollama not found. Install from: https://ollama.ai');
}

if (ollamaInstalled) {
  console.log('\n[5/5] Pulling AI model (qwen2.5:0.5b)...');
  try {
    execSync('ollama pull qwen2.5:0.5b', { stdio: 'inherit' });
    console.log('  ✓ Model ready');
  } catch (e) {
    console.log('  ⚠ Run manually: ollama pull qwen2.5:0.5b');
  }
} else {
  console.log('\n[5/5] Skipped model pull (Ollama not installed)');
}

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║           ✅ Setup Complete!                      ║');
console.log('╠═══════════════════════════════════════════════════╣');
console.log('║ Next steps:                                       ║');
console.log('║ 1. Set up profile:  node index.js profile         ║');
console.log('║ 2. Scrape jobs:     node index.js scrape -s indeed║');
console.log('║ 3. Auto-apply:      node index.js apply           ║');
console.log('╚═══════════════════════════════════════════════════╝');

