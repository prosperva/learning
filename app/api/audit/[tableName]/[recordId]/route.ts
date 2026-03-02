import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

type RouteParams = {
  params: Promise<{ tableName: string; recordId: string }>;
};

// GET /api/audit/[tableName]/[recordId]?page=0&pageSize=500
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tableName, recordId } = await params;
  const { searchParams } = request.nextUrl;

  const page = searchParams.get('page') ?? '0';
  const pageSize = searchParams.get('pageSize') ?? '500';

  const response = await fetch(
    `${BACKEND_URL}/api/audit/${tableName}/${recordId}?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        'Content-Type': 'application/json',
        // Forward auth cookie if present
        ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : {}),
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return NextResponse.json(
      { message: error.message || 'Failed to fetch audit logs' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
