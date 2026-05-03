import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, source, contact_info, message_context, business_id } = data;

    if (!name || !source) {
      return NextResponse.json({ error: 'Name and source are required' }, { status: 400 });
    }

    const insert = db.prepare(`
      INSERT INTO leads (name, source, contact_info, message_context, business_id)
      VALUES (@name, @source, @contact_info, @message_context, @business_id)
    `);

    const result = insert.run({
      name,
      source,
      contact_info: contact_info || null,
      message_context: message_context || null,
      business_id: business_id || null,
    });

    return NextResponse.json({ success: true, lead_id: result.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
