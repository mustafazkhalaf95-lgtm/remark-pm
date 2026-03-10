import { NextRequest, NextResponse } from 'next/server';

// This is the old channel-based chat system.
// The new chat system lives at /api/chat/rooms.
// These endpoints return stubs that point callers to the new API.

export async function GET() {
  return NextResponse.json({
    message: 'This endpoint is deprecated. Use /api/chat/rooms instead.',
    channels: [],
  });
}

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/chat/rooms instead.' },
    { status: 410 }
  );
}
