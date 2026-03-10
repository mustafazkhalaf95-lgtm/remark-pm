import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/redistribute
// Redistribute unassigned tasks across team members for each task model.
// Uses MarketingTask, CreativeRequest, ProductionJob, PublishingItem.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { clientId } = body as { clientId?: string };

    // Get all team members (users with profiles)
    const users = await prisma.user.findMany({
      where: { status: 'active' },
      include: { profile: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No active users found' }, { status: 400 });
    }

    const userIds = users.map(u => u.id);
    const results: Record<string, { total: number; reassigned: number }> = {};

    // --- MarketingTask: assign unassigned tasks round-robin ---
    const unassignedMarketing = await prisma.marketingTask.findMany({
      where: {
        assigneeId: null,
        status: { not: 'completed' },
        ...(clientId ? { clientId } : {}),
      },
    });
    let idx = 0;
    for (const task of unassignedMarketing) {
      await prisma.marketingTask.update({
        where: { id: task.id },
        data: { assigneeId: userIds[idx % userIds.length] },
      });
      idx++;
    }
    results.marketingTasks = { total: unassignedMarketing.length, reassigned: unassignedMarketing.length };

    // --- CreativeRequest: assign unassigned conceptWriter round-robin ---
    const unassignedCreative = await prisma.creativeRequest.findMany({
      where: {
        conceptWriterId: null,
        status: { not: 'completed' },
        ...(clientId ? { clientId } : {}),
      },
    });
    idx = 0;
    for (const task of unassignedCreative) {
      await prisma.creativeRequest.update({
        where: { id: task.id },
        data: { conceptWriterId: userIds[idx % userIds.length] },
      });
      idx++;
    }
    results.creativeRequests = { total: unassignedCreative.length, reassigned: unassignedCreative.length };

    // --- ProductionJob: assign unassigned jobs round-robin ---
    const unassignedProduction = await prisma.productionJob.findMany({
      where: {
        assigneeId: null,
        status: { not: 'completed' },
        ...(clientId ? { clientId } : {}),
      },
    });
    idx = 0;
    for (const task of unassignedProduction) {
      await prisma.productionJob.update({
        where: { id: task.id },
        data: { assigneeId: userIds[idx % userIds.length] },
      });
      idx++;
    }
    results.productionJobs = { total: unassignedProduction.length, reassigned: unassignedProduction.length };

    // --- PublishingItem: assign unassigned reviewer round-robin ---
    const unassignedPublishing = await prisma.publishingItem.findMany({
      where: {
        reviewerId: null,
        status: { not: 'published' },
        ...(clientId ? { clientId } : {}),
      },
    });
    idx = 0;
    for (const task of unassignedPublishing) {
      await prisma.publishingItem.update({
        where: { id: task.id },
        data: { reviewerId: userIds[idx % userIds.length] },
      });
      idx++;
    }
    results.publishingItems = { total: unassignedPublishing.length, reassigned: unassignedPublishing.length };

    const totalReassigned = Object.values(results).reduce((sum, r) => sum + r.reassigned, 0);

    return NextResponse.json({
      success: true,
      results,
      summary: `Redistributed ${totalReassigned} tasks across ${userIds.length} team members`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Admin Redistribute]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
