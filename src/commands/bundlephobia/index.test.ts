import { buildBundlephobiaQueryHandler } from './index';
import { getData } from '../../utils/urlTools';
import { getChosenResult } from '../../utils/discordTools';
import * as errors from '../../utils/errors';
import {
  response,
  detailResponse,
  dateFn,
  similar,
  previousVersion,
} from './__fixtures__/response';
import useData from '../../utils/useData';

describe('buildBundlephobiaQueryHandler', () => {
  const editMock = jest.fn();
  const replyCallback = jest.fn();
  const sendMock = jest.fn(() =>
    Promise.resolve({
      edit: editMock,
      reply: replyCallback,
    })
  );

  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    reply: replyMock,
  };

  const fetch: jest.MockedFunction<typeof getData> = jest.fn();
  const fetchDetail: jest.MockedFunction<typeof useData> = jest.fn();
  const choose: jest.MockedFunction<typeof getChosenResult> = jest.fn();

  beforeEach(() => {
    fetch.mockResolvedValue(response);
  });

  afterEach(() => jest.resetAllMocks());

  test('fails when API request responds with error', async () => {
    fetch.mockResolvedValueOnce(null);
    const handler = buildBundlephobiaQueryHandler(fetch, fetchDetail, choose);
    await handler(msg, 'moment.js');

    expect(choose).not.toBeCalled();
    expect(msg.channel.send).not.toBeCalled();
  });

  test('works when API request responds, but fails if the reply dies', async () => {
    choose.mockResolvedValueOnce(null);
    const handler = buildBundlephobiaQueryHandler(fetch, fetchDetail, choose);
    await handler(msg, 'moment.js');
    expect(fetchDetail).not.toBeCalled();
  });

  test('works when reply response, but dies on detail', async () => {
    choose.mockResolvedValueOnce({
      name: 'moment',
      url: 'http://big.thick.dates',
      description: 'Parse, validate, manipulate, and display dates',
    });

    fetchDetail.mockResolvedValue({
      error: true,
      json: null,
      text: null,
    });

    const handler = buildBundlephobiaQueryHandler(fetch, fetchDetail, choose);
    await handler(msg, 'moment.js');

    expect(msg.reply).toBeCalledWith(errors.invalidResponse);
  });

  test('works when API request responds and details responds', async () => {
    choose.mockResolvedValueOnce({
      name: 'moment',
      url: 'http://big.thick.dates',
      description: 'Parse, validate, manipulate, and display dates',
    });

    // Mock the implementation since there's no way in hell I am going to
    // extract each call into a service function.
    fetchDetail.mockImplementation(async (url: string) => {
      if (url.includes('similar-packages')) {
        return {
          json: similar,
          error: false,
          text: null,
        };
      }

      if (url.includes('date-fn')) {
        return {
          json: dateFn,
          error: false,
          text: null,
        };
      }

      if (url.includes('package-history')) {
        return {
          json: previousVersion,
          error: false,
          text: null,
        };
      }

      return {
        json: detailResponse,
        error: false,
        text: null,
      };
    });

    const handler = buildBundlephobiaQueryHandler(fetch, fetchDetail, choose);
    await handler(msg, 'moment.js');

    expect(editMock.mock.calls[0]).toMatchSnapshot();
  });
});
