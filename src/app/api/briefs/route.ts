import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/briefs - List campaigns as "briefs" (brief model no longer exists)
// Uses Campaign as the closest equivalent to the old Brief model.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, nameAr: true } },
        marketingTasks: {
          include: {
            assignee: {
              select: { id: true, profile: { select: { fullName: true } } },
            },
          },
        },
        creativeRequests: {
          include: {
            conceptWriter: {
              select: { id: true, profile: { select: { fullName: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json(campaigns);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Briefs GET]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/briefs - Create a new campaign (acts as brief creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, clientId, startDate, endDate, budget } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: 'title and clientId are required' },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: title,
        description: description || '',
        clientId,
        status: 'planning',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget || '',
      },
      include: {
        client: { select: { id: true, name: true, nameAr: true } },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Briefs POST]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
