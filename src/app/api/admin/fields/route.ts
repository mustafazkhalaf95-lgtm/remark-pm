import { NextRequest, NextResponse } from 'next/server';

// Custom fields feature is not in the current schema.
// These endpoints return stub data for backward compatibility.

export async function GET() {
  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
