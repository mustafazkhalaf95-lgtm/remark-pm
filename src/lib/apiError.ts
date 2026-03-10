/* ══════════════════════════════════════════════════════════
   Remark PM — Unified API Error Handler
   Standard error classes and response formatting for
   consistent bilingual error handling across all routes.
   ══════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ─── Error Classes ───

export class ApiError extends Error {
    status: number;
    messageAr: string;
    code?: string;

    constructor(message: string, messageAr: string, status: number, code?: string) {
        super(message);
        this.messageAr = messageAr;
        this.status = status;
        this.code = code;
        this.name = 'ApiError';
    }
}

export class BadRequestError extends ApiError {
    constructor(message = 'Bad request', messageAr = 'طلب غير صالح') {
        super(message, messageAr, 400, 'BAD_REQUEST');
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized', messageAr = 'غير مصرح — يرجى تسجيل الدخول') {
        super(message, messageAr, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden', messageAr = 'ليس لديك صلاحية للوصول') {
        super(message, messageAr, 403, 'FORBIDDEN');
    }
}

export class NotFoundError extends ApiError {
    constructor(resource = 'Resource', id?: string) {
        const msg = id ? `${resource} with id ${id} not found` : `${resource} not found`;
        const msgAr = id ? `${resource} بمعرف ${id} غير موجود` : `${resource} غير موجود`;
        super(msg, msgAr, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends ApiError {
    constructor(message = 'Conflict', messageAr = 'تعارض في البيانات') {
        super(message, messageAr, 409, 'CONFLICT');
    }
}

export class RateLimitError extends ApiError {
    constructor() {
        super('Too many requests', 'طلبات كثيرة — حاول لاحقاً', 429, 'RATE_LIMIT');
    }
}

// ─── Error Response Builder ───

export function errorToResponse(error: unknown): NextResponse {
    // Known API errors
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                error: error.messageAr,
                error_en: error.message,
                code: error.code,
                ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
            },
            { status: error.status }
        );
    }

    // Zod validation errors
    if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return NextResponse.json(
            {
                error: 'بيانات غير صالحة',
                error_en: 'Validation failed',
                code: 'VALIDATION_ERROR',
                fields: fieldErrors,
            },
            { status: 400 }
        );
    }

    // Prisma known errors
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any;
        if (prismaError.code === 'P2002') {
            return NextResponse.json(
                {
                    error: 'هذا السجل موجود مسبقاً',
                    error_en: 'Record already exists (unique constraint violation)',
                    code: 'DUPLICATE',
                    field: prismaError.meta?.target?.[0],
                },
                { status: 409 }
            );
        }
        if (prismaError.code === 'P2025') {
            return NextResponse.json(
                {
                    error: 'السجل المطلوب غير موجود',
                    error_en: 'Record not found',
                    code: 'NOT_FOUND',
                },
                { status: 404 }
            );
        }
    }

    // Unknown errors
    console.error('[API Error]', error);
    return NextResponse.json(
        {
            error: 'حدث خطأ داخلي',
            error_en: 'Internal server error',
            code: 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && error instanceof Error
                ? { message: error.message, stack: error.stack }
                : {}),
        },
        { status: 500 }
    );
}

// ─── Route Handler Wrapper ───

type RouteHandler = (req: Request, context?: any) => Promise<NextResponse>;

export function handleRoute(handler: RouteHandler): RouteHandler {
    return async (req: Request, context?: any) => {
        try {
            return await handler(req, context);
        } catch (error) {
            return errorToResponse(error);
        }
    };
}
