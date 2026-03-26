import { NextRequest, NextResponse } from 'next/server';
import { createAxiosInstanceWithToken } from "@/utils/axiosInstance";
import { getValidAccessToken } from "@/utils/getValidAccessToken";

type RouteParams = { params: Promise<{ tableName: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const token = await getValidAccessToken(request);
    if (!token) {
        return NextResponse.json({ error: "Unauthorized or token expired" }, { status: 401 });
    }
  const { tableName } = await params;
  const axios = createAxiosInstanceWithToken(token);

  const body = await request.json();

  const res = await axios.put(`/auditconfig/${tableName}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.statusText;
  try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
  }
  catch (e){
      return NextResponse.json({error: e}, { status: res.status });
  }
}
