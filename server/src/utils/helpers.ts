import { config } from '../config';
import { PaginationParams, PaginatedResponse } from '../types';

/**
 * Parse pagination query params with defaults and clamping.
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const rawLimit = parseInt(String(query.limit || config.pagination.defaultLimit), 10) || config.pagination.defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), config.pagination.maxLimit);
  return { page, limit };
}

/**
 * Build a paginated response envelope.
 */
export function paginate<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Generate a URL-safe slug from a string, appending a short random suffix for uniqueness.
 */
export function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

/**
 * Map frontend category format (e.g. 'food-drink') to DB enum format ('FOOD_DRINK') and vice versa.
 */
export function categoryToDb(cat: string): string {
  return cat.toUpperCase().replace(/-/g, '_');
}

export function categoryFromDb(cat: string): string {
  return cat.toLowerCase().replace(/_/g, '-');
}

/**
 * Safely parse a JSON string array stored in SQLite, returning [] on failure.
 */
export function parseTags(tagsStr: string): string[] {
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
