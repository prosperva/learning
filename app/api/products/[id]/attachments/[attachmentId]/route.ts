import { NextRequest, NextResponse } from 'next/server';
import { attachments } from '../route';

type RouteParams = {
  params: Promise<{ id: string; attachmentId: string }>;
};

// DELETE /api/products/[id]/attachments/[attachmentId]
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id, attachmentId } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
  }

  const index = attachments.findIndex(
    (a) => a.id === attachmentId && a.productId === productId
  );

  if (index === -1) {
    return NextResponse.json({ message: 'Attachment not found' }, { status: 404 });
  }

  // In production: also delete the actual file from storage
  attachments.splice(index, 1);

  await new Promise((resolve) => setTimeout(resolve, 200));

  return new NextResponse(null, { status: 204 });
}
