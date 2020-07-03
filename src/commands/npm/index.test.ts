import { getChosenResult } from '../../utils/discordTools';
import { getData } from '../../utils/urlTools';
import { response } from './__fixtures__/response';

import { buildNPMQueryHandler } from '.';

describe('npm', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    delete: replyMock,
    reply: replyMock,
  };

  const fetch: jest.MockedFunction<typeof getData> = jest.fn();
  const choose: jest.MockedFunction<typeof getChosenResult> = jest.fn();

  afterEach(() => jest.resetAllMocks());

  test('returns when request fails', async () => {
    fetch.mockResolvedValue(null);
    const handler = buildNPMQueryHandler(fetch);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'npm',
      searchTerm: 'search term',
    });

    expect(choose).not.toBeCalled();
  });

  test('awaits user response when request works', async () => {
    const editMock = jest.fn();
    fetch.mockResolvedValue(response);
    choose.mockResolvedValue({
      author: { name: '', url: '' },
      description: '',
      externalUrls: { homepage: '', repository: '' },
      lastUpdate: '',
      maintainers: '10',
      name: 'React',
      url: 'http://react',
    });

    msg.channel.send.mockResolvedValue({ edit: editMock });

    const handler = buildNPMQueryHandler(fetch, choose, () => '20 days');
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'npm',
      searchTerm: 'search term',
    });

    expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
    expect(choose.mock.calls[0]).toMatchSnapshot();
    expect(sendMock.mock.calls[0]).toMatchSnapshot();
  });
});
