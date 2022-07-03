import type { Response } from 'node-fetch';
import fetch from 'node-fetch';

import useData from './useData.js';

jest.mock('node-fetch');
const urlGen = () => `http://example.com/?q=${Date.now()}`;

describe('useData', () => {
  const headers = { headers: {} };
  const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(jest.clearAllMocks);

  test('returns errors when response is not ok', async () => {
    const url = urlGen();

    fetchMock.mockResolvedValue({
      ok: false,
    } as unknown as Response);

    const response = await useData(url, 'text');

    expect(fetchMock).toBeCalledWith(url, headers);
    expect(response).toStrictEqual({
      error: true,
      json: null,
      text: null,
    });
  });

  test.each([
    [
      'json',
      () => {
        const jsonMock = jest.fn();
        jsonMock.mockResolvedValue({ test: 'cached' });

        fetchMock.mockResolvedValue({
          json: jsonMock,
          ok: true,
        } as unknown as Response);

        return jsonMock;
      },
      lastResponse => {
        expect(lastResponse.json).toStrictEqual({ test: 'cached' });
      },
    ],
    [
      'text',
      () => {
        const textMock = jest.fn();
        textMock.mockResolvedValue('text');

        fetchMock.mockResolvedValue({
          ok: true,
          text: textMock,
        } as unknown as Response);

        return textMock;
      },
      lastResponse => {
        expect(lastResponse.text).toBe('text');
      },
    ],
  ] as const)(
    'should cache entries for type: `%s`',
    async (type: Parameters<typeof useData>['1'], mock, assertResponse) => {
      const url = urlGen();
      const mockTarget = mock();

      const response = await useData(url, type);

      expect(fetchMock).toBeCalledWith(url, headers);

      assertResponse(response);

      const allCachedResponses = await Promise.all([
        useData(url, type),
        useData(url, type),
        useData(url, type),
        useData(url, type),
      ]);

      expect(mockTarget).toBeCalledTimes(1);
      expect(fetchMock).toBeCalledTimes(1);

      allCachedResponses.forEach(lastResponse => {
        assertResponse(lastResponse);
      });
    }
  );
});
