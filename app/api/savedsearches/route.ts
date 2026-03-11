import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const res = await fetch(`${BACKEND}/api/savedsearches?${searchParams}`, {
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${BACKEND}/api/savedsearches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${BACKEND}/api/savedsearches`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
