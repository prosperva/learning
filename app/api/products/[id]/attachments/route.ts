import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

type RouteParams = { params: Promise<{ id: string }> };

function cookie(request: NextRequest) {
  const c = request.headers.get('cookie');
  return c ? { cookie: c } : {};
}

// GET /api/products/[id]/attachments
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const res = await fetch(`${BACKEND}/api/products/${id}/attachments`, {
    headers: { ...cookie(request) },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

// POST /api/products/[id]/attachments  (file upload — stream the form data)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const formData = await request.formData();

  const res = await fetch(`${BACKEND}/api/products/${id}/attachments`, {
    method: 'POST',
    headers: { ...cookie(request) },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
