import { getData } from '../../utils/urlTools';
import { getChosenResult } from '../../utils/discordTools';
import { buildGithubQueryHandler } from './index';
import { response } from './__fixtures__/response';
import useData from '../../utils/useData';

describe('github', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    reply: replyMock,
  };

  const fetch: jest.MockedFunction<typeof getData> = jest.fn();
  const fetchDetails: jest.MockedFunction<typeof useData> = jest.fn();
  const choose: jest.MockedFunction<typeof getChosenResult> = jest.fn();

  afterEach(() => jest.clearAllMocks());

  test('returns when request fails', async () => {
    fetch.mockResolvedValue(null);
    const handler = buildGithubQueryHandler(fetch);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      isInvalidData: expect.any(Function),
      msg,
      provider: 'github',
      searchTerm: 'search term',
    });

    expect(choose).not.toBeCalled();
  });

  test('awaits user response when request works', async () => {
    const editMock = jest.fn();
    fetch.mockResolvedValue(response);
    choose.mockResolvedValue({
      name: 'React',
      owner: {
        name: 'Facebook',
        type: 'something',
        avatar: 'some_avator',
      },
      description: 'React',
      url: 'https://facebook.com/react',
      updated: new Date(),
      created: new Date(),
      language: 'en-US',
      stars: 10000,
      forks: '',
      issues: 0,
    });

    fetchDetails.mockResolvedValue({
      error: false,
      json: {
        key: 'key',
        name: 'MIT',
        spdx_id: 'mit',
        url: 'http://choosealicense.com/licenses/mit',
        node_id: '',
        html_url: 'http://choosealicense.com/licenses/mit',
        description: 'MIT',
        implementation: 'MIT',
        permissions: [],
        conditions: [],
        limitations: [],
        body: 'MIT',
        featured: true,
      },
      text: null,
    });

    msg.channel.send.mockResolvedValue({ edit: editMock });

    const handler = buildGithubQueryHandler(fetch, fetchDetails, choose);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      isInvalidData: expect.any(Function),
      msg,
      provider: 'github',
      searchTerm: 'search term',
    });

    expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
    expect(choose.mock.calls[0]).toMatchSnapshot();
    expect(sendMock.mock.calls[0]).toMatchSnapshot();
  });
});
