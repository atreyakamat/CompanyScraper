import { NextResponse } from 'next/server';
import { Ollama } from 'ollama';

// You can change the host if Ollama is running elsewhere
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

export async function POST(req: Request) {
  try {
    const { leadName, messageContext, businessContext, model = 'qwen3:0.6b' } = await req.json();

    if (!leadName || !messageContext) {
      return NextResponse.json({ error: 'leadName and messageContext are required' }, { status: 400 });
    }

    const prompt = `
You are an expert sales representative. Draft a professional, engaging, and concise reply to the following lead.

Lead Name: ${leadName}
Lead Message/Context: ${messageContext}
Business/Product Context: ${businessContext || 'N/A'}

Provide ONLY the text of the reply. Do not include introductory remarks or conversational filler.
    `;

    const response = await ollama.generate({
      model: model,
      prompt: prompt,
      stream: false,
    });

    return NextResponse.json({ reply: response.response.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
