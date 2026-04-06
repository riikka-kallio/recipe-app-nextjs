import { NextRequest, NextResponse } from 'next/server';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Create a successful JSON response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  pagination?: ApiResponse['pagination']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination,
  });
}

/**
 * Create an error JSON response
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  errors?: Array<{ field: string; message: string }>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      errors,
    },
    { status }
  );
}

/**
 * Extract pagination parameters from URL search params
 */
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };
}

/**
 * Mock user ID for MVP (Phase 3)
 * NOTE: Database uses UUID IDs (migrated from INTEGER) - using mock UUID for development
 * TODO: Replace with real authentication in Phase 7
 */
export const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Get mock user ID from request
 * TODO: Replace with real auth token parsing in Phase 7
 */
export function getUserIdFromRequest(request: NextRequest): string {
  // For now, return the mock UUID (matches database schema after UUID migration)
  // In Phase 7, this will extract the user ID from the auth token
  return MOCK_USER_ID;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push({ field, message: `${field} is required` });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Handle async route errors with try-catch wrapper
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error('API Route Error:', error);
      
      // Handle Supabase errors
      if (error.code) {
        return createErrorResponse(
          error.message || 'Database error occurred',
          500
        );
      }

      // Handle generic errors
      return createErrorResponse(
        error.message || 'Internal server error',
        error.statusCode || 500
      );
    }
  };
}
