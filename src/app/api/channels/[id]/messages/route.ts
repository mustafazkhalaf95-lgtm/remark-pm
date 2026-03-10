import { NextRequest, NextResponse } from 'next/server';

// This is the old channel-based messaging system.
// The new chat system lives at /api/chat/rooms/[id]/messages.
// These endpoints return stubs that point callers to the new API.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    message: `This endpoint is deprecated. Use /api/chat/rooms/${id}/messages instead.`,
    messages: [],
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { error: `This endpoint is deprecated. Use /api/chat/rooms/${id}/messages instead.` },
    { status: 410 }
  );
}
