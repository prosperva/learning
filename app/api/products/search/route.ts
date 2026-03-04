import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${BACKEND}/api/products/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : {}),
    },
    body,
  });
  const data = await res.json().catch(() => ({ message: 'Invalid request body' }));
  return NextResponse.json(data, { status: res.status });
}
