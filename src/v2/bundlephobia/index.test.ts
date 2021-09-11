import { getChosenResult } from '../../utils/discordTools';
import * as errors from '../../utils/errors';
import { getData } from '../../utils/urlTools';
import useData from '../../utils/useData';
import {
  response,
  detailResponse,
  dateFn,
  similar,
  previousVersion,
} from './__fixtures__/response';

import { buildBundlephobiaQueryHandler } from '.';

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
    delete: replyMock,
    reply: replyMock,
  };

  const fetch: jest.MockedFunction<typeof getData> = jest.fn();
  const fetchDetail: jest.MockedFunction<typeof useData> = jest.fn();
  const choose: jest.MockedFunction<typeof getChosenResult> = jest.fn();

  beforeEach(() => {
    fetch.mockResolvedValue(response);
  });

  afterEach(() => jest.clearAllMocks());

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
      description: 'Parse, validate, manipulate, and display dates',
      name: 'moment',
      url: 'http://big.thick.dates',
    });

    fetchDetail.mockResolvedValueOnce({
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
      description: 'Parse, validate, manipulate, and display dates',
      name: 'moment',
      url: 'http://big.thick.dates',
    });

    // Mock the implementation since there's no way in hell I am going to
    // extract each call into a service function.
    fetchDetail.mockImplementation(
      (url: string) =>
        new Promise(resolve => {
          if (url.includes('similar-packages')) {
            resolve({
              error: false,
              json: similar,
              text: null,
            });
          }

          if (url.includes('date-fn')) {
            resolve({
              error: false,
              json: dateFn,
              text: null,
            });
          }

          if (url.includes('package-history')) {
            resolve({
              error: false,
              json: previousVersion,
              text: null,
            });
          }

          resolve({
            error: false,
            json: detailResponse,
            text: null,
          });
        })
    );

    const handler = buildBundlephobiaQueryHandler(fetch, fetchDetail, choose);
    await handler(msg, 'moment.js');

    expect(editMock.mock.calls[0]).toBeDefined();
    expect(editMock.mock.calls[0][0]).toMatchSnapshot();
  });
});
