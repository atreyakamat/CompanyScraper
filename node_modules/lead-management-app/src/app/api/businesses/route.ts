import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const businesses = db.prepare('SELECT * FROM businesses ORDER BY name ASC').all();
    return NextResponse.json({ businesses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const insert = db.prepare('INSERT INTO businesses (name, description) VALUES (?, ?)');
    const result = insert.run(name, description || null);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
