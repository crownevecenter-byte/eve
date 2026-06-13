import { describe, it, expect } from 'vitest';
import { shouldRetryQuery, queryRetryDelay } from './queryRetry';

describe('queryRetry', () => {
  it('does not retry without HTTP response', () => {
    expect(shouldRetryQuery(0, new Error('network'))).toBe(false);
  });

  it('does not retry 401/403/404/429', () => {
    expect(shouldRetryQuery(0, { response: { status: 401 } })).toBe(false);
    expect(shouldRetryQuery(0, { response: { status: 404 } })).toBe(false);
    expect(shouldRetryQuery(0, { response: { status: 429 } })).toBe(false);
  });

  it('retries 5xx once', () => {
    expect(shouldRetryQuery(0, { response: { status: 500 } })).toBe(true);
    expect(shouldRetryQuery(1, { response: { status: 500 } })).toBe(false);
  });

  it('caps retry delay', () => {
    expect(queryRetryDelay(0)).toBe(1000);
    expect(queryRetryDelay(10)).toBeLessThanOrEqual(12000);
  });
});
