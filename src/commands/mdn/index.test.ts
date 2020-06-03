import useData from '../../utils/useData';
import { getSearchUrl } from '../../utils/urlTools';
import { queryBuilder } from './index';
import * as errors from '../../utils/errors';
import * as DomParser from 'dom-parser';

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
    reply: replyMock,
  };

  beforeEach(() => {
    mockGetSearchUrl.mockReturnValue('Search Term');
  });

  afterEach(() => jest.resetAllMocks());

  test('replies with invalid response error if search URL fails', async () => {
    mockUseData.mockResolvedValue({
      error: true,
      text: null,
      json: null,
    });

    await queryBuilder()(msg, 'Search Term');

    expect(msg.reply).toHaveBeenCalledWith(errors.invalidResponse);
    expect(msg.channel.send).not.toHaveBeenCalled();
  });

  test('replies with 0 documents found', async () => {
    mockUseData.mockResolvedValue({
      error: false,
      text: 'Example',
      json: null,
    });

    await queryBuilder(text => {
      expect(text).toEqual('Example');
      return {
        isEmpty: true,
        results: [],
        meta: '',
      };
    })(msg, 'Search Term');

    expect(msg.reply).toBeCalledWith(errors.noResults('Search Term'));
  });

  test('responds with list embedded', async () => {
    mockUseData.mockResolvedValue({
      error: false,
      text: 'Example',
      json: null,
    });

    await queryBuilder(
      text => {
        expect(text).toEqual('Example');
        return {
          isEmpty: false,
          results: [
            {
              getElementsByClassName(
                className: string
              ): DomParser.Node[] | null {
                if (className == 'result-title') {
                  return [
                    {
                      textContent: '',
                      getAttribute() {
                        return 'http://example.com';
                      },
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
          meta: '',
        };
      },
      () => {
        return {
          title: 'Example',
          url: 'http://www.example.com',
          excerpt: '',
        };
      },
      async () => {
        return [
          {
            url: 'http://www.example.com',
          },
        ] as any;
      }
    )(msg, 'Search Term');

    expect(msg.channel.send).toHaveBeenCalledTimes(1);
    const sentMessage = msg.channel.send.mock.calls[0][0];
    expect(sentMessage.embed.description).toContain(
      '1. [**Example** - ](http://www.example.com)'
    );
  });
});
