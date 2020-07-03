import * as errors from '../../utils/errors';

import { buildPHPQueryHandler } from '.';

describe('buildPHPQueryHandler', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    delete: jest.fn(),
    reply: replyMock,
  };

  afterEach(() => jest.resetAllMocks());

  test('replies with error', async () => {
    const handler = buildPHPQueryHandler(
      searchTerm =>
        new Promise(resolve =>
          resolve({
            error: true,
            searchUrl: `http://php.net/?q=${searchTerm}`,
            text: '',
          })
        )
    );

    await handler(msg, 'Wrong');
    expect(msg.reply).toBeCalledWith(errors.invalidResponse);
  });

  test('replies with a direct URL', async () => {
    const handler = buildPHPQueryHandler(
      searchTerm =>
        new Promise(resolve =>
          resolve({
            error: false,
            searchUrl: `http://php.net/?q=${searchTerm}`,
            text: '',
          })
        ),
      text => {
        return {
          isDirect: true,
          results: [],
        };
      }
    );

    await handler(msg, 'array_pop');
    expect(msg.channel.send).toBeCalledWith('https://www.php.net/array_pop');
  });

  test('parses the body', async () => {
    const handler = buildPHPQueryHandler(
      searchTerm =>
        new Promise(resolve =>
          resolve({
            error: false,
            searchUrl: `http://php.net/?q=${searchTerm}`,
            text: '',
          })
        ),
      () => ({
        isDirect: false,
        results: [
          {
            firstChild: {},
          } as any,
        ],
      }),
      () => {
        return {
          title: 'array_pop is a PHP function',
          url: 'https://www.php.net/array_pop',
        };
      },
      () =>
        Promise.resolve({
          firstChild: {},
        } as any)
    );

    await handler(msg, 'array_pop');
    expect(msg.channel.send).toBeCalledWith(
      expect.objectContaining({
        embed: expect.objectContaining({
          description: expect.stringContaining('array_pop is a PHP function'),
        }),
      })
    );
  });
});
