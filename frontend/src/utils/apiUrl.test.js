import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isNetworkTransportError,
  isMisroutedProxyResponse,
  DIRECT_API,
} from './apiUrl';

describe('apiUrl helpers', () => {
  it('detects network transport errors', () => {
    expect(isNetworkTransportError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isNetworkTransportError({ message: 'QUIC idle timeout' })).toBe(true);
    expect(isNetworkTransportError({ response: { status: 500 } })).toBe(false);
  });

  it('detects misrouted proxy HTML responses', () => {
    const config = { baseURL: 'https://www.crownevcenter.com/api' };
    vi.stubGlobal('window', { location: { origin: 'https://www.crownevcenter.com' } });

    expect(
      isMisroutedProxyResponse(
        { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
        config
      )
    ).toBe(true);

    expect(
      isMisroutedProxyResponse(
        { status: 200, headers: { 'content-type': 'application/json' } },
        config
      )
    ).toBe(false);

    vi.unstubAllGlobals();
  });

  it('exposes production API constant', () => {
    expect(DIRECT_API).toContain('api.crownevcenter.com');
  });
});
