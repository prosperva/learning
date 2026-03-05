import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string; fieldName: string }> }
) {
  const { tableName, fieldName } = await params;
  const res = await fetch(`${BACKEND}/api/audit/config/${tableName}/${fieldName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await request.json()),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
