import * as DomParser from 'dom-parser';

import * as errors from '../../utils/errors';
import { getSearchUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

import { queryBuilder } from '.';

jest.mock('dom-parser');
jest.mock('../../utils/urlTools');
jest.mock('../../utils/useData');

const mockGetSearchUrl: jest.MockedFunction<typeof getSearchUrl> = getSearchUrl as any;
const mockUseData: jest.MockedFunction<typeof useData> = useData as any;

describe('handleMDNQuery', () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    delete: replyMock,
    reply: replyMock,
  };

  beforeEach(() => {
    mockGetSearchUrl.mockReturnValue('Search Term');
  });

  afterEach(() => jest.resetAllMocks());

  test('replies with invalid response error if search URL fails', async () => {
    mockUseData.mockResolvedValue({
      error: true,
      json: null,
      text: null,
    });

    await queryBuilder()(msg, 'Search Term');

    expect(msg.reply).toHaveBeenCalledWith(errors.invalidResponse);
    expect(msg.channel.send).not.toHaveBeenCalled();
  });

  test('replies with 0 documents found', async () => {
    mockUseData.mockResolvedValue({
      error: false,
      json: null,
      text: 'Example',
    });

    await queryBuilder(text => {
      expect(text).toEqual('Example');
      return {
        isEmpty: true,
        meta: '',
        results: [],
      };
    })(msg, 'Search Term');

    expect(msg.reply).toBeCalledWith(errors.noResults('Search Term'));
  });

  test('responds with list embedded', async () => {
    mockUseData.mockResolvedValue({
      error: false,
      json: null,
      text: 'Example',
    });

    await queryBuilder(
      text => {
        expect(text).toEqual('Example');
        return {
          isEmpty: false,
          meta: '',
          results: [
            {
              getElementsByClassName(
                className: string
              ): DomParser.Node[] | null {
                if (className === 'result-title') {
                  return [
                    {
                      getAttribute() {
                        return 'http://example.com';
                      },
                      textContent: '',
                    } as any,
                  ];
                }
                return [
                  {
                    textContent: 'Some markdown',
                  } as any,
                ];
              },
            } as any,
          ],
        };
      },
      () => ({
        excerpt: '',
        title: 'Example',
        url: 'http://www.example.com',
      }),
      () =>
        [
          {
            url: 'http://www.example.com',
          },
        ] as any
    )(msg, 'Search Term');

    expect(msg.channel.send).toHaveBeenCalledTimes(1);
    const sentMessage = msg.channel.send.mock.calls[0][0];
    expect(sentMessage).toMatchSnapshot();
  });
});
