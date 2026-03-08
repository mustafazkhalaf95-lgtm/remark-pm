import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// List custom fields for a workspace or a specific board
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const boardId = searchParams.get('boardId');

    // Support querying by boardId — get fields linked to a specific board
    if (boardId) {
        const boardFields = await prisma.boardCustomField.findMany({
            where: { boardId },
            include: {
                field: {
                    include: {
                        _count: { select: { values: true } },
                    },
                },
            },
        });
        const fields = boardFields.map(bf => ({
            ...bf.field,
            boardId: bf.boardId,
        }));
        return NextResponse.json(fields);
    }

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId or boardId required' }, { status: 400 });

    const fields = await prisma.customField.findMany({
        where: { workspaceId },
        include: {
            boardFields: { include: { board: { select: { id: true, name: true, color: true } } } },
            _count: { select: { values: true } },
        },
        orderBy: { position: 'asc' },
    });

    return NextResponse.json(fields);
}

// Create a new custom field
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { workspaceId, name, displayName, fieldType, options, boardIds } = await request.json();
        if (!workspaceId || !name || !displayName) {
            return NextResponse.json({ error: 'workspaceId, name, displayName required' }, { status: 400 });
        }

        const count = await prisma.customField.count({ where: { workspaceId } });

        const field = await prisma.customField.create({
            data: {
                name,
                displayName,
                fieldType: fieldType || 'TEXT',
                options: options ? JSON.stringify(options) : '[]',
                position: count,
                workspaceId,
            },
        });

        // Link to boards if specified
        if (boardIds && Array.isArray(boardIds)) {
            for (const boardId of boardIds) {
                await prisma.boardCustomField.create({
                    data: { boardId, fieldId: field.id },
                }).catch(() => { });
            }
        }

        return NextResponse.json(field, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update a custom field
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { fieldId, name, displayName, fieldType, options, boardIds } = await request.json();
        if (!fieldId) return NextResponse.json({ error: 'fieldId required' }, { status: 400 });

        const data: any = {};
        if (name) data.name = name;
        if (displayName) data.displayName = displayName;
        if (fieldType) data.fieldType = fieldType;
        if (options) data.options = JSON.stringify(options);

        const field = await prisma.customField.update({
            where: { id: fieldId },
            data,
        });

        // Update board associations
        if (boardIds && Array.isArray(boardIds)) {
            await prisma.boardCustomField.deleteMany({ where: { fieldId } });
            for (const boardId of boardIds) {
                await prisma.boardCustomField.create({
                    data: { boardId, fieldId },
                }).catch(() => { });
            }
        }

        return NextResponse.json(field);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete a custom field
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const fieldId = searchParams.get('fieldId');
        if (!fieldId) return NextResponse.json({ error: 'fieldId required' }, { status: 400 });

        await prisma.customField.delete({ where: { id: fieldId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
