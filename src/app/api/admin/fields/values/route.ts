import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Set card field value
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { cardId, fieldId, value } = await request.json();
        if (!cardId || !fieldId) return NextResponse.json({ error: 'cardId, fieldId required' }, { status: 400 });

        const existingValue = await prisma.cardFieldValue.findUnique({
            where: { cardId_fieldId: { cardId, fieldId } },
        });

        if (existingValue) {
            const updated = await prisma.cardFieldValue.update({
                where: { id: existingValue.id },
                data: { value: value || '' },
                include: { field: true },
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.cardFieldValue.create({
                data: { cardId, fieldId, value: value || '' },
                include: { field: true },
            });
            return NextResponse.json(created, { status: 201 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
