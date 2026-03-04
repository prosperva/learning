import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

function cookie(request: NextRequest) {
  const c = request.headers.get('cookie');
  return c ? { cookie: c } : {};
}

// GET /api/products?page=0&pageSize=25&...
export async function GET(request: NextRequest) {
  const url = new URL(`${BACKEND}/api/products`);
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { ...cookie(request) } });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

// POST /api/products  (create)
export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${BACKEND}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cookie(request) },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
