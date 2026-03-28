const { profileOps } = require('./db/database');

const testProfile = {
  full_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '9876543210',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  github_url: 'https://github.com/johndoe',
  portfolio_url: 'https://johndoe.dev',
  current_title: 'Senior Software Engineer',
  years_experience: 5,
  skills: 'JavaScript, Node.js, React, SQL, Python',
  education: 'B.Tech in Computer Science',
  work_experience: '5 years at Tech Corp as Senior Engineer',
  resume_path: 'C:\\Users\\atkam\\resume.pdf',
  cover_letter_template: 'Dear Hiring Manager, I am {name} and I am applying for {role} at {company}.',
  preferred_locations: 'Remote, Bangalore, Pune',
  preferred_job_types: 'Full-time',
  min_salary: 20
};

try {
  profileOps.upsert.run(testProfile);
  console.log('Test profile created successfully.');
} catch (err) {
  console.error('Error creating test profile:', err.message);
}
