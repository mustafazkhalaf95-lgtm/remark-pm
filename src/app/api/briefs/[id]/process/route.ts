import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Phase definitions with role/position mappings and day offsets from publish date
const VIDEO_PHASES = [
  { phase: 'CONTENT_WRITING', label: 'Content Writing', daysBefore: 8, position: 0, taskModel: 'marketing' as const },
  { phase: 'DESIGN', label: 'Design', daysBefore: 6, position: 1, taskModel: 'creative' as const },
  { phase: 'PHOTOGRAPHY', label: 'Photography', daysBefore: 5, position: 2, taskModel: 'production' as const },
  { phase: 'VIDEO_EDIT', label: 'Video Editing', daysBefore: 4, position: 3, taskModel: 'production' as const },
  { phase: 'CREATIVE_REVIEW', label: 'Creative Review', daysBefore: 3, position: 4, taskModel: 'creative' as const },
  { phase: 'CEO_REVIEW', label: 'Management Review', daysBefore: 2, position: 5, taskModel: 'marketing' as const },
  { phase: 'CLIENT_APPROVAL', label: 'Client Approval', daysBefore: 1, position: 6, taskModel: 'marketing' as const },
  { phase: 'PUBLISH', label: 'Publish', daysBefore: 0, position: 7, taskModel: 'publishing' as const },
];

const DESIGN_PHASES = [
  { phase: 'CONTENT_WRITING', label: 'Content Writing', daysBefore: 6, position: 0, taskModel: 'marketing' as const },
  { phase: 'DESIGN', label: 'Design', daysBefore: 4, position: 1, taskModel: 'creative' as const },
  { phase: 'CREATIVE_REVIEW', label: 'Creative Review', daysBefore: 2, position: 2, taskModel: 'creative' as const },
  { phase: 'CEO_REVIEW', label: 'Management Review', daysBefore: 1, position: 3, taskModel: 'marketing' as const },
  { phase: 'CLIENT_APPROVAL', label: 'Client Approval', daysBefore: 1, position: 4, taskModel: 'marketing' as const },
  { phase: 'PUBLISH', label: 'Publish', daysBefore: 0, position: 5, taskModel: 'publishing' as const },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// POST /api/briefs/[id]/process
// Process a campaign (brief) by creating tasks across MarketingTask, CreativeRequest,
// ProductionJob, and PublishingItem models.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const { contentType, publishDate } = body as {
      contentType?: string;
      publishDate?: string;
    };

    // Fetch the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { client: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const phases = contentType === 'VIDEO' ? VIDEO_PHASES : DESIGN_PHASES;
    const targetDate = publishDate ? new Date(publishDate) : campaign.endDate || new Date();

    const createdTasks: Array<{ phase: string; model: string; id: string }> = [];

    for (const phaseDef of phases) {
      const dueDate = addDays(targetDate, -phaseDef.daysBefore);
      const taskTitle = `${campaign.name} - ${phaseDef.label}`;

      if (phaseDef.taskModel === 'marketing') {
        const task = await prisma.marketingTask.create({
          data: {
            clientId: campaign.clientId,
            campaignId: campaign.id,
            title: taskTitle,
            status: phaseDef.position === 0 ? 'in_progress' : 'pending',
            priority: 'high',
            dueDate,
          },
        });
        createdTasks.push({ phase: phaseDef.phase, model: 'MarketingTask', id: task.id });
      } else if (phaseDef.taskModel === 'creative') {
        const task = await prisma.creativeRequest.create({
          data: {
            clientId: campaign.clientId,
            campaignId: campaign.id,
            title: taskTitle,
            status: phaseDef.position === 0 ? 'in_progress' : 'new_request',
            priority: 'high',
            dueDate,
          },
        });
        createdTasks.push({ phase: phaseDef.phase, model: 'CreativeRequest', id: task.id });
      } else if (phaseDef.taskModel === 'production') {
        const task = await prisma.productionJob.create({
          data: {
            clientId: campaign.clientId,
            campaignId: campaign.id,
            title: taskTitle,
            status: 'pending',
            priority: 'high',
            dueDate,
          },
        });
        createdTasks.push({ phase: phaseDef.phase, model: 'ProductionJob', id: task.id });
      } else if (phaseDef.taskModel === 'publishing') {
        const task = await prisma.publishingItem.create({
          data: {
            clientId: campaign.clientId,
            campaignId: campaign.id,
            title: taskTitle,
            status: 'draft',
            scheduledAt: dueDate,
          },
        });
        createdTasks.push({ phase: phaseDef.phase, model: 'PublishingItem', id: task.id });
      }
    }

    // Update campaign status to active
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'active' },
    });

    return NextResponse.json({
      success: true,
      campaignId,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Brief Process]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
