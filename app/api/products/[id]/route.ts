import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

type RouteParams = { params: Promise<{ id: string }> };

function cookie(request: NextRequest) {
  const c = request.headers.get('cookie');
  return c ? { cookie: c } : {};
}

// GET /api/products/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/products/${id}`, {
    headers: { ...cookie(request) },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, {
    status: res.status,
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
  });
}

// PUT /api/products/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.text();
  const res = await fetch(`${BACKEND}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...cookie(request) },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

// DELETE /api/products/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/products/${id}`, {
    method: 'DELETE',
    headers: { ...cookie(request) },
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
