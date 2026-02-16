import { NextRequest, NextResponse } from 'next/server';
import { products } from '../../route';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// In-memory attachment store (simulates database)
interface AttachmentRecord {
  id: string;
  productId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export const attachments: AttachmentRecord[] = [];

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// GET /api/products/[id]/attachments
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  }

  const productAttachments = attachments.filter((a) => a.productId === productId);

  await new Promise((resolve) => setTimeout(resolve, 100));

  return NextResponse.json({ attachments: productAttachments });
}

// POST /api/products/[id]/attachments
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // In production: save file to filesystem/cloud storage
    // For mock: store metadata only
    const attachment: AttachmentRecord = {
      id: generateId(),
      productId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      url: `/api/products/${productId}/attachments/${generateId()}/download`,
    };

    attachments.push(attachment);

    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json({ attachment }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to process upload' }, { status: 400 });
  }
}
