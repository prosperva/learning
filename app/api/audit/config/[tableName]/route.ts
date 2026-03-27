import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

type RouteParams = { params: Promise<{ tableName: string }> };

// PUT /api/audit/config/{tableName} — batch upsert all changed fields for a table
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { tableName } = await params;
  const res = await fetch(`${BACKEND}/api/audit/config/${tableName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await request.json()),
  });
  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ error: text }, { status: res.status });
  }
}
