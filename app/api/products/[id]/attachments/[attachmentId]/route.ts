import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

type RouteParams = { params: Promise<{ id: string; attachmentId: string }> };

function cookie(request: NextRequest) {
  const c = request.headers.get('cookie');
  return c ? { cookie: c } : {};
}

// DELETE /api/products/[id]/attachments/[attachmentId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id, attachmentId } = await params;
  const res = await fetch(`${BACKEND}/api/products/${id}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { ...cookie(request) },
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
