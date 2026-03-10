import { NextRequest, NextResponse } from 'next/server';

// Card mirroring is from an old architecture (board/card/list model).
// The current schema uses MarketingTask, CreativeRequest, ProductionJob, PublishingItem.
// Cross-board syncing is handled via linked*Id fields on those models.

export async function POST() {
  return NextResponse.json(
    { error: 'Not implemented. Use cross-board sync via linked task IDs instead.' },
    { status: 501 }
  );
}
