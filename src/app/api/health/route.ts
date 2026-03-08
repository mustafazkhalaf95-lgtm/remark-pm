import { NextResponse } from 'next/server';

const startTime = Date.now();

// GET /api/health — No auth required (for monitoring)
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
