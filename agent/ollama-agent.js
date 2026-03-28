const axios = require('axios');
let db; try { db = require('../db/database'); } catch(e) {}
const { getProfile, getFieldValue } = require('../profile/profile');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:0.6b';

async function checkOllama() {
  try {
    await axios.get(`${OLLAMA_URL}/api/tags`);
    return true;
  } catch (e) {
    console.error('[AI] Ollama not running. Start with: ollama serve');
    return false;
  }
}

async function chat(prompt, context = '') {
  const systemPrompt = `You are a helpful assistant that helps fill job application forms.
You have access to the user's profile. Answer concisely and accurately.
If you don't know the answer, say "NEED_INPUT" and the user will provide it.`;

  try {
    const res = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: `${systemPrompt}\n\nContext: ${context}\n\nUser: ${prompt}`,
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
  const prompt = `Form field: name="${name}", type="${type}", label="${label || ''}", placeholder="${placeholder || ''}".
User profile: ${JSON.stringify(profile, null, 2)}
What value should be entered? Return ONLY the value, nothing else.`;

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
    const result = db.aiMemoryOps.search.get(`%${question}%`);
    return result?.answer || null;
  }
  return null;
}

module.exports = { checkOllama, chat, analyzeFormField, generateCoverLetter, rememberAnswer, recallAnswer, OLLAMA_URL, MODEL };
