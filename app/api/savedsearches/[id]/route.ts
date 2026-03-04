import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/savedsearches/${id}`);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  const res = await fetch(`${BACKEND}/api/savedsearches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/savedsearches/${id}`, { method: 'DELETE' });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
