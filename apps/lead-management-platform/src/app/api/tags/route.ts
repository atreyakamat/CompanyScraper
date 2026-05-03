import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
    return NextResponse.json({ tags });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, color } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const insert = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');
    const result = insert.run(name, color || '#808080');

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
