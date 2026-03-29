import { describe, it, expect, vi } from 'vitest';
import { authenticate } from '../../middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

function makeMockReq(headers: Record<string, string> = {}) {
  return {
    headers,
    userId: undefined as string | undefined,
  } as any;
}

function makeMockRes() {
  return {} as any;
}

describe('authenticate middleware', () => {
  it('returns 401 if no token provided', () => {
    const req = makeMockReq({});
    const res = makeMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Authentication required');
  });

  it('returns 401 if token is invalid', () => {
    const req = makeMockReq({ authorization: 'Bearer invalid-token-here' });
    const res = makeMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Invalid token');
  });

  it('returns 401 if token is expired', () => {
    const token = jwt.sign({ userId: 'user-1' }, config.jwtSecret, { expiresIn: '-1s' });
    const req = makeMockReq({ authorization: `Bearer ${token}` });
    const res = makeMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('expired');
  });

  it('passes and sets userId on request if token is valid', () => {
    const token = jwt.sign({ userId: 'user-123' }, config.jwtSecret, { expiresIn: '1h' });
    const req = makeMockReq({ authorization: `Bearer ${token}` });
    const res = makeMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined(); // no error
    expect(req.userId).toBe('user-123');
  });

  it('rejects tokens without Bearer prefix', () => {
    const token = jwt.sign({ userId: 'user-1' }, config.jwtSecret, { expiresIn: '1h' });
    const req = makeMockReq({ authorization: token });
    const res = makeMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
  });
});
