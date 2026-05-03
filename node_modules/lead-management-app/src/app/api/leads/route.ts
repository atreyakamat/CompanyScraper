import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
