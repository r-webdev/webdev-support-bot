import { userNotFound } from '../../utils/errors';

import pointsHandler from '.';

test('should throw an error if no user has been found', async () => {
  const sendMock = jest.fn();
  const replyMock = jest.fn();

  const msg: any = {
    author: { id: '1', tag: 'test#1234' },
    channel: { send: sendMock },
    reply: replyMock,
  };

  const res = await pointsHandler(msg);
  expect(res).toThrowError(userNotFound);
});
