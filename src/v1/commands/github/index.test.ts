import { getChosenResult } from '../../utils/discordTools';
import { getData } from '../../utils/urlTools';
import useData from '../../utils/useData';
import { response } from './__fixtures__/response';

import { buildGithubQueryHandler } from '.';

describe('github', () => {
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
      created: new Date(),
      description: 'React',
      forks: '',
      issues: 0,
      language: 'en-US',
      name: 'React',
      owner: {
        avatar: 'some_avator',
        name: 'Facebook',
        type: 'something',
      },
      stars: 10000,
      updated: new Date(),
      url: 'https://facebook.com/react',
    });

    fetchDetails.mockResolvedValue({
      error: false,
      json: {
        body: 'MIT',
        conditions: [],
        description: 'MIT',
        featured: true,
        html_url: 'http://choosealicense.com/licenses/mit',
        implementation: 'MIT',
        key: 'key',
        limitations: [],
        name: 'MIT',
        node_id: '',
        permissions: [],
        spdx_id: 'mit',
        url: 'http://choosealicense.com/licenses/mit',
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
