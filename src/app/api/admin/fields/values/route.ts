import { NextRequest, NextResponse } from 'next/server';

// Card field values feature is not in the current schema.
// This endpoint returns stub data for backward compatibility.

export async function PUT() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
