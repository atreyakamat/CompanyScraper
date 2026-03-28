const readline = require('readline');
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
  
  console.log('\n📋 Profile Setup for Auto-Apply\n');
  const existing = getProfile() || {};
  const profile = {};
  
  for (const f of FIELDS) {
    const hint = existing[f.key] ? ` [${existing[f.key]}]` : '';
    let val = await ask(`${f.label}${f.required ? '*' : ''}${hint}: `);
    if (!val && existing[f.key]) val = existing[f.key];
    if (f.type === 'number' && val) val = parseInt(val, 10);
    profile[f.key] = val || null;
  }
  
  profile.cover_letter_template = await ask('Cover Letter Template: ') || existing.cover_letter_template || 
    'Dear Hiring Manager, I am excited to apply for this position. Best regards, {name}';
  
  rl.close();
  saveProfile(profile);
  console.log('\n✅ Profile saved!');
  displayProfile(profile);
  return profile;
}

function displayProfile(p) {
  p = p || getProfile();
  if (!p) { console.log('No profile. Run: node index.js profile'); return; }
  console.log('\n┌─── Your Profile ───┐');
  console.log(`│ Name: ${p.full_name || '-'}`);
  console.log(`│ Email: ${p.email || '-'}`);
  console.log(`│ Phone: ${p.phone || '-'}`);
  console.log(`│ Title: ${p.current_title || '-'}`);
  console.log(`│ Skills: ${p.skills || '-'}`);
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
