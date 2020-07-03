import { getChosenResult } from '../../utils/discordTools';
import * as errors from '../../utils/errors';
import { getData } from '../../utils/urlTools';
import useData from '../../utils/useData';
import { PackagistResponse } from './types';

import { buildComposerQueryHandler } from '.';

describe('handleComposerQuery', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    delete: replyMock,
    reply: replyMock,
  };

  const fetch: jest.MockedFunction<typeof getData> = jest.fn();
  const fetchUse: jest.MockedFunction<typeof useData> = jest.fn();
  const choose: jest.MockedFunction<typeof getChosenResult> = jest.fn();

  afterEach(() => jest.resetAllMocks());

  test('does nothing when packagist request is invalid', async () => {
    fetch.mockResolvedValue(null);
    const handler = buildComposerQueryHandler(fetch);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'composer',
      searchTerm: 'search term',
    });

    expect(msg.channel.send).not.toHaveBeenCalled();
  });

  test('returns when chosen result is not given', async () => {
    const packageRes: PackagistResponse = {
      results: [
        {
          description: 'Better than Laravel',
          downloads: 10000,
          favers: 10000,
          name: 'Symfony',
          repository: 'https://github.com/symfony/symfony',
          url: 'https://symfony.com',
        },
      ],
      total: 1,
    };

    fetch.mockResolvedValue(packageRes);
    // eslint-disable-next-line unicorn/no-useless-undefined
    choose.mockResolvedValue(undefined);
    msg.channel.send.mockResolvedValue(null);

    const handler = buildComposerQueryHandler(fetch, fetchUse, choose);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'composer',
      searchTerm: 'search term',
    });

    expect(msg.channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        embed: expect.objectContaining({
          description: expect.stringContaining('Symfony'),
        }),
      })
    );
    expect(fetchUse).not.toBeCalled();
  });

  test('calls the use useData method and fails', async () => {
    const packageRes: PackagistResponse = {
      results: [
        {
          description: 'Better than Laravel',
          downloads: 10000,
          favers: 10000,
          name: 'Symfony',
          repository: 'https://github.com/symfony/symfony',
          url: 'https://symfony.com',
        },
      ],
      total: 1,
    };

    fetch.mockResolvedValue(packageRes);
    choose.mockResolvedValue({
      description: 'Better than Laravel',
      downloads: 10000,
      name: 'Symfony',
      repository: 'https://github.com/symfony/symfony',
      stars: 10000,
      url: 'https://symfony.com',
    });
    fetchUse.mockResolvedValue({
      error: true,
      json: null,
      text: null,
    });

    msg.channel.send.mockResolvedValue(null);

    const handler = buildComposerQueryHandler(fetch, fetchUse, choose);
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'composer',
      searchTerm: 'search term',
    });

    const payload = msg.channel.send.mock.calls[0][0];
    expect(payload).toMatchSnapshot();
    expect(msg.reply).toBeCalledWith(errors.invalidResponse);
  });

  test('calls the use useData method and succeeds', async () => {
    const editMock = jest.fn();
    msg.channel.send.mockResolvedValue({ edit: editMock });

    const packageRes: PackagistResponse = {
      results: [
        {
          description: 'Better than Laravel',
          downloads: 10000,
          favers: 10000,
          name: 'Symfony',
          repository: 'https://github.com/symfony/symfony',
          url: 'https://symfony.com',
        },
      ],
      total: 1,
    };

    fetch.mockResolvedValue(packageRes);
    choose.mockResolvedValue({
      description: 'Better than Laravel',
      downloads: 10000,
      name: 'Symfony',
      repository: 'https://github.com/symfony/symfony',
      stars: 10000,
      url: 'https://symfony.com',
    });
    fetchUse.mockResolvedValue({
      error: false,
      json: {
        package: {
          dependents: 10,
          description: 'Better than Laravel',
          downloads: {
            daily: 1234,
            monthly: 1234,
            total: 1000000,
          },
          favers: 1234,
          github_forks: 1000,
          github_open_issues: 0,
          github_stars: 10000,
          github_watchers: 10000,
          language: 'PHP',
          maintainers: [
            {
              avatar_url: 'http://avatar',
              name: 'A Name',
            },
          ],
          name: 'Symfony',
          repository: 'https://github.com/symfony/symfony',
          suggesters: 1000,
          time: new Date('2020-01-01'),
          type: 'Framework',
          versions: {
            '1.0.0': {
              authors: [{ name: 'Example ' }],
              description: 'master',
              homepage: 'https://github.com/symfony/symfony',
              keywords: ['PHP'],
              license: ['MIT'],
              name: 'master',
              require: ['php', '7'],
              time: new Date('2020-01-01'),
              version: '1.0.0',
              version_normalized: '1.0.0',
            },
            'dev-master': {
              authors: [{ name: 'Example ' }],
              description: 'master',
              homepage: 'https://github.com/symfony/symfony',
              keywords: ['PHP'],
              license: ['MIT'],
              name: 'master',
              require: ['php', '7'],
              time: new Date('2020-01-01'),
              version: '1.0.0',
              version_normalized: '1.0.0',
            },
          },
        },
      },
      text: null,
    });

    const handler = buildComposerQueryHandler(
      fetch,
      fetchUse,
      choose,
      () => '5 months'
    );
    await handler(msg, 'search term');

    expect(fetch).toBeCalledWith({
      isInvalidData: expect.any(Function),
      msg,
      provider: 'composer',
      searchTerm: 'search term',
    });

    const payload = msg.channel.send.mock.calls[0][0];
    expect(payload).toMatchSnapshot();

    expect(msg.channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        embed: expect.objectContaining({
          description: expect.stringContaining('Symfony'),
        }),
      })
    );

    const editPayload = sendMock.mock.calls[0][0];
    expect(editPayload).toMatchSnapshot();
    expect(editMock).toBeCalled();
    expect(editMock.mock.calls[0][0]).toMatchSnapshot();
  });
});
