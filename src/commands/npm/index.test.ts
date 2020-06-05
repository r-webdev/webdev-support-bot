import { getData } from '../../utils/urlTools';
import { getChosenResult } from '../../utils/discordTools';
import { response } from './__fixtures__/response';
import { buildNPMQueryHandler } from './index';

describe('npm', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
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
      externalUrls: { homepage: '', repository: '' },
      name: 'React',
      url: 'http://react',
      description: '',
      lastUpdate: '',
      maintainers: '10',
      author: { name: '', url: '' },
    });

    msg.channel.send.mockResolvedValue({ edit: editMock });

    const handler = buildNPMQueryHandler(fetch, choose);
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