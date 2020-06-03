import * as errors from '../../utils/errors';
import { buildPHPQueryHandler } from './index';

describe('buildPHPQueryHandler', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    reply: replyMock,
  };

  afterEach(() => jest.resetAllMocks());

  test('replies with error', async () => {
    const handler = buildPHPQueryHandler(async searchTerm => {
      return {
        error: true,
        text: '',
        searchUrl: `http://php.net/?q=${searchTerm}`,
      };
    });

    await handler(msg, 'Wrong');
    expect(msg.reply).toBeCalledWith(errors.invalidResponse);
  });

  test('replies with a direct URL', async () => {
    const handler = buildPHPQueryHandler(
      async searchTerm => {
        return {
          error: false,
          text: '',
          searchUrl: `http://php.net/?q=${searchTerm}`,
        };
      },
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
      async searchTerm => {
        return {
          error: false,
          text: '',
          searchUrl: `http://php.net/?q=${searchTerm}`,
        };
      },
      () => {
        return {
          isDirect: false,
          results: [
            {
              firstChild: {},
            } as any,
          ],
        };
      },
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
