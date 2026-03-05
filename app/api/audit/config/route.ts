import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_API_URL ?? '';

export async function GET() {
  const res = await fetch(`${BACKEND}/api/audit/config`);
  return NextResponse.json(await res.json(), { status: res.status });
}
