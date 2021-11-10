import { getChosenResult } from '../../utils/discordTools';
import { getData } from '../../utils/urlTools';
import useData from '../../utils/useData';
import { simpleResponse, detailedResponse } from './__fixtures__/response';

import { buildCanIUseQueryHandler } from '.';

describe('caniuse', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    delete: replyMock,
    reply: replyMock,
  };

  const fetch: jest.MockedFunction<typeof getData> = jest.fn();
  const fetchDetails: jest.MockedFunction<typeof useData> = jest.fn();
  const choose: jest.MockedFunction<typeof getChosenResult> = jest.fn();

  beforeEach(() => {
    fetch.mockResolvedValue(simpleResponse);
    fetchDetails.mockResolvedValue({
      error: false,
      json: detailedResponse,
      text: null,
    });
  });

  afterEach(() => jest.resetAllMocks());

  test('returns when request fails', async () => {
    fetch.mockResolvedValueOnce(null);
    const handler = buildCanIUseQueryHandler(fetch);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'caniuse',
      sanitizeData: expect.any(Function),
      searchTerm: 'search term',
    });

    expect(choose).not.toBeCalled();
  });

  test('awaits user response when request works', async () => {
    const editMock = jest.fn();
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

    const handler = buildCanIUseQueryHandler(fetch, fetchDetails, choose);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'caniuse',
      sanitizeData: expect.any(Function),
      searchTerm: 'search term',
    });

    expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
    expect(choose.mock.calls[0]).toMatchSnapshot();
    expect(sendMock.mock.calls[0]).toMatchSnapshot();
  });
});
