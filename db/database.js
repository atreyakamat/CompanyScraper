const Database = require('better-sqlite3');
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

db.exec(`
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
`);

const jobOps = {
  insert: db.prepare(`INSERT OR IGNORE INTO jobs (title, company, location, job_type, date_posted, job_link, source, description, company_email, salary) VALUES (@title, @company, @location, @job_type, @date_posted, @job_link, @source, @description, @company_email, @salary)`),
  getAll: db.prepare('SELECT * FROM jobs ORDER BY scraped_at DESC'),
  getNew: db.prepare("SELECT * FROM jobs WHERE applied = 0 AND status = 'new' ORDER BY scraped_at DESC"),
  getById: db.prepare('SELECT * FROM jobs WHERE id = ?'),
  markApplied: db.prepare("UPDATE jobs SET applied = 1, applied_at = CURRENT_TIMESTAMP, status = 'applied' WHERE id = ?"),
  count: db.prepare('SELECT COUNT(*) as count FROM jobs'),
  countNew: db.prepare("SELECT COUNT(*) as count FROM jobs WHERE applied = 0 AND status = 'new'"),
};

const profileOps = {
  get: db.prepare('SELECT * FROM user_profile WHERE id = 1'),
  upsert: db.prepare(`INSERT INTO user_profile (id, full_name, email, phone, linkedin_url, github_url, portfolio_url, current_title, years_experience, skills, education, work_experience, resume_path, cover_letter_template, preferred_locations, preferred_job_types, min_salary, updated_at) VALUES (1, @full_name, @email, @phone, @linkedin_url, @github_url, @portfolio_url, @current_title, @years_experience, @skills, @education, @work_experience, @resume_path, @cover_letter_template, @preferred_locations, @preferred_job_types, @min_salary, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET full_name=@full_name, email=@email, phone=@phone, linkedin_url=@linkedin_url, github_url=@github_url, portfolio_url=@portfolio_url, current_title=@current_title, years_experience=@years_experience, skills=@skills, education=@education, work_experience=@work_experience, resume_path=@resume_path, cover_letter_template=@cover_letter_template, preferred_locations=@preferred_locations, preferred_job_types=@preferred_job_types, min_salary=@min_salary, updated_at=CURRENT_TIMESTAMP`),
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
