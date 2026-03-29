import { describe, it, expect, vi } from 'vitest';
import { validate } from '../../middleware/validate';

function makeMockReq(body: Record<string, unknown>) {
  return { body } as any;
}

function makeMockRes() {
  return {} as any;
}

describe('validate middleware', () => {
  it('passes when all required fields are present', () => {
    const middleware = validate({
      name: { required: true, type: 'string' },
      age: { required: true, type: 'number' },
    });

    const next = vi.fn();
    middleware(makeMockReq({ name: 'Alice', age: 30 }), makeMockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('returns 400 when required field is missing', () => {
    const middleware = validate({
      email: { required: true, type: 'string' },
    });

    const next = vi.fn();
    middleware(makeMockReq({}), makeMockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('email is required');
  });

  it('returns 400 when required field is empty string', () => {
    const middleware = validate({
      name: { required: true, type: 'string' },
    });

    const next = vi.fn();
    middleware(makeMockReq({ name: '' }), makeMockRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });

  it('validates type constraints - string', () => {
    const middleware = validate({
      name: { type: 'string' },
    });

    const next = vi.fn();
    middleware(makeMockReq({ name: 123 }), makeMockRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('must be a string');
  });

  it('validates type constraints - number', () => {
    const middleware = validate({
      count: { type: 'number' },
    });

    const next = vi.fn();
    middleware(makeMockReq({ count: 'not-a-number' }), makeMockRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('must be a number');
  });

  it('validates minLength', () => {
    const middleware = validate({
      password: { type: 'string', minLength: 8 },
    });

    const next = vi.fn();
    middleware(makeMockReq({ password: 'short' }), makeMockRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('at least 8 characters');
  });

  it('validates maxLength', () => {
    const middleware = validate({
      name: { type: 'string', maxLength: 5 },
    });

    const next = vi.fn();
    middleware(makeMockReq({ name: 'a very long name' }), makeMockRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('at most 5 characters');
  });

  it('validates pattern matching', () => {
    const middleware = validate({
      email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format.' },
    });

    const next = vi.fn();
    middleware(makeMockReq({ email: 'not-an-email' }), makeMockRes(), next);

    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Invalid email format');
  });

  it('passes valid pattern', () => {
    const middleware = validate({
      email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    });

    const next = vi.fn();
    middleware(makeMockReq({ email: 'test@example.com' }), makeMockRes(), next);

    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('skips validation for optional undefined fields', () => {
    const middleware = validate({
      bio: { type: 'string', minLength: 5 },
    });

    const next = vi.fn();
    middleware(makeMockReq({}), makeMockRes(), next);

    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});
