/* ══════════════════════════════════════════════════════════
   Remark PM — API Route Handler Utilities
   Standard helpers for request validation, pagination,
   and consistent response formatting.
   ══════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { paginationSchema } from './validations';

// ─── Validate Request Body ───

export async function validateBody<T>(
    req: Request,
    schema: z.ZodSchema<T>
): Promise<T> {
    const body = await req.json();
    return schema.parse(body);
}

// ─── Validate Query Params ───

export function validateParams<T>(
    url: string,
    schema: z.ZodSchema<T>
): T {
    const { searchParams } = new URL(url);
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
}

// ─── Standard Success Response ───

export function sendSuccess<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
}

// ─── Paginated Success Response ───

export function sendPaginated<T>(
    data: T[],
    total: number,
    take: number,
    skip: number
): NextResponse {
    return NextResponse.json({
        data,
        total,
        take,
        skip,
        hasMore: skip + take < total,
        pages: Math.ceil(total / take),
    });
}

// ─── Parse Pagination from URL ───

export function parsePagination(url: string): {
    take: number;
    skip: number;
    orderBy: string;
    orderDir: 'asc' | 'desc';
} {
    const { searchParams } = new URL(url);
    return paginationSchema.parse({
        take: searchParams.get('take') ?? undefined,
        skip: searchParams.get('skip') ?? undefined,
        orderBy: searchParams.get('orderBy') ?? undefined,
        orderDir: searchParams.get('orderDir') ?? undefined,
    });
}

// ─── Parse Search/Filter Params ───

export function parseFilters(
    url: string,
    allowedFields: string[]
): Record<string, string> {
    const { searchParams } = new URL(url);
    const filters: Record<string, string> = {};
    for (const field of allowedFields) {
        const value = searchParams.get(field);
        if (value) {
            filters[field] = value;
        }
    }
    return filters;
}

// ─── Build Prisma Where Clause ───

export function buildWhere(
    filters: Record<string, string>,
    searchFields?: string[],
    searchQuery?: string
): Record<string, any> {
    const where: Record<string, any> = {};

    for (const [key, value] of Object.entries(filters)) {
        if (value === 'true' || value === 'false') {
            where[key] = value === 'true';
        } else {
            where[key] = value;
        }
    }

    // Full-text search across multiple fields
    if (searchQuery && searchFields && searchFields.length > 0) {
        where.OR = searchFields.map((field) => ({
            [field]: { contains: searchQuery },
        }));
    }

    return where;
}

// ─── Build Prisma OrderBy ───

export function buildOrderBy(
    orderBy: string,
    orderDir: 'asc' | 'desc',
    allowedFields: string[]
): Record<string, 'asc' | 'desc'> {
    const field = allowedFields.includes(orderBy) ? orderBy : 'createdAt';
    return { [field]: orderDir };
}

// ─── Sanitize Text Input ───

export function sanitizeText(input: string): string {
    return input
        .trim()
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .substring(0, 10000);
}

// ─── Extract ID from Dynamic Route ───

export function getRouteId(params: { id: string } | Promise<{ id: string }>): string | Promise<string> {
    if (params instanceof Promise) {
        return params.then((p) => p.id);
    }
    return params.id;
}
