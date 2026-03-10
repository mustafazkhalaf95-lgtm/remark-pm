import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/phases - Manage task status transitions
// Replaces the old TaskPhase-based workflow with direct status updates
// on MarketingTask, CreativeRequest, ProductionJob, and PublishingItem.
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskType, action } = body as {
      taskId: string;
      taskType: 'marketing_task' | 'creative_request' | 'production_job' | 'publishing_item';
      action: 'start' | 'complete' | 'block';
    };

    if (!taskId || !taskType || !action) {
      return NextResponse.json(
        { error: 'taskId, taskType, and action are required' },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      start: 'in_progress',
      complete: 'completed',
      block: 'blocked',
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json(
        { error: 'Invalid action. Use: start, complete, or block' },
        { status: 400 }
      );
    }

    let updated: unknown = null;

    switch (taskType) {
      case 'marketing_task': {
        updated = await prisma.marketingTask.update({
          where: { id: taskId },
          data: {
            status: newStatus,
            ...(action === 'complete' ? { completedAt: new Date() } : {}),
          },
        });
        break;
      }

      case 'creative_request': {
        const crStatus = action === 'complete' ? 'approved' : action === 'block' ? 'new_request' : 'in_progress';
        updated = await prisma.creativeRequest.update({
          where: { id: taskId },
          data: {
            status: crStatus,
            ...(action === 'block' ? { blocked: true, blockReason: 'Blocked via phase transition' } : {}),
            ...(action === 'start' ? { blocked: false, blockReason: '' } : {}),
          },
        });
        break;
      }

      case 'production_job': {
        updated = await prisma.productionJob.update({
          where: { id: taskId },
          data: { status: newStatus },
        });
        break;
      }

      case 'publishing_item': {
        const pubStatus = action === 'complete' ? 'published' : action === 'start' ? 'scheduled' : 'draft';
        updated = await prisma.publishingItem.update({
          where: { id: taskId },
          data: {
            status: pubStatus,
            ...(action === 'complete' ? { publishedAt: new Date() } : {}),
          },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid taskType. Use: marketing_task, creative_request, production_job, or publishing_item' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, task: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Phases PUT]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
