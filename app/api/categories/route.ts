import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

export async function GET(request: NextRequest) {
  const res = await fetch(`${BACKEND}/api/categories`, {
    headers: {
      ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, {
    status: res.status,
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
