import { describe, it, expect } from 'vitest';
import { parsePagination, paginate, generateSlug, categoryToDb, categoryFromDb, parseTags } from '../../utils/helpers';

describe('parsePagination', () => {
  it('returns default values when no params provided', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('returns correct offset and limit for page 2', () => {
    const result = parsePagination({ page: '2', limit: '10' });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it('clamps page to minimum of 1', () => {
    const result = parsePagination({ page: '0' });
    expect(result.page).toBe(1);
  });

  it('clamps limit to maximum of 100', () => {
    const result = parsePagination({ limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('falls back to default limit for zero', () => {
    const result = parsePagination({ limit: '0' });
    // parseInt('0') is 0, which is falsy, so falls back to defaultLimit
    expect(result.limit).toBe(20);
  });
});

describe('paginate', () => {
  it('returns correct pagination envelope', () => {
    const data = [1, 2, 3];
    const result = paginate(data, 25, { page: 2, limit: 10 });

    expect(result.data).toEqual([1, 2, 3]);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('returns hasNext false on last page', () => {
    const result = paginate([], 10, { page: 2, limit: 5 });
    expect(result.pagination.hasNext).toBe(false);
  });

  it('returns hasPrev false on first page', () => {
    const result = paginate([], 10, { page: 1, limit: 5 });
    expect(result.pagination.hasPrev).toBe(false);
  });
});

describe('generateSlug', () => {
  it('creates a valid slug from text', () => {
    const slug = generateSlug('Hello World');
    expect(slug).toMatch(/^hello-world-[a-z0-9]+$/);
  });

  it('removes special characters', () => {
    const slug = generateSlug('Event @ The Venue! (2024)');
    expect(slug).not.toContain('@');
    expect(slug).not.toContain('!');
    expect(slug).not.toContain('(');
    expect(slug).not.toContain(')');
  });

  it('handles empty string', () => {
    const slug = generateSlug('');
    // Should produce just the random suffix with a leading dash
    expect(slug).toMatch(/^-[a-z0-9]+$/);
  });

  it('collapses multiple spaces and dashes', () => {
    const slug = generateSlug('hello   world---test');
    // Should not have consecutive dashes in the base portion
    expect(slug).toMatch(/^hello-world-test-[a-z0-9]+$/);
  });

  it('appends unique suffix', () => {
    const slug1 = generateSlug('Same Title');
    const slug2 = generateSlug('Same Title');
    // Extremely unlikely to be the same due to random suffix
    expect(slug1).not.toBe(slug2);
  });
});

describe('categoryToDb / categoryFromDb', () => {
  it('converts frontend format to DB format', () => {
    expect(categoryToDb('food-drink')).toBe('FOOD_DRINK');
    expect(categoryToDb('arts-culture')).toBe('ARTS_CULTURE');
  });

  it('converts DB format to frontend format', () => {
    expect(categoryFromDb('FOOD_DRINK')).toBe('food-drink');
    expect(categoryFromDb('MUSIC')).toBe('music');
  });
});

describe('parseTags', () => {
  it('parses valid JSON array', () => {
    expect(parseTags('["tag1","tag2"]')).toEqual(['tag1', 'tag2']);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseTags('not json')).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(parseTags('"just a string"')).toEqual([]);
  });
});
