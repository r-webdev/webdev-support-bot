import fetch from 'node-fetch';
import useData from './useData';

jest.mock('node-fetch');

describe('useData', () => {
  const fetchMock: jest.MockedFunction<typeof fetch> = fetch as any;

  test('should cache entries', async () => {
    const url = 'http://example.com';
    const headers = { headers: {} };

    fetchMock.mockResolvedValue({
      ok: true,
      json() {
        return Promise.resolve({
          test: 'cached',
        });
      },
    } as any);

    const response = await useData(url);
    expect(fetchMock).toBeCalledWith(url, headers);
    expect(response).toEqual({
      error: false,
      json: { test: 'cached' },
      text: null,
    });

    const allCachedResponses = await Promise.all([
      useData(url),
      useData(url),
      useData(url),
      useData(url),
    ]);

    expect(fetchMock).toBeCalledTimes(1);
    allCachedResponses.forEach(lastResponse => {
      expect(lastResponse.json).toEqual({ test: 'cached' });
    });
  });
});
