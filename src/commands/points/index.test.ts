import { dbConnect } from '../..';

import pointsHandler from '.';

beforeAll(() => dbConnect());

test('should throw an error if no user has been found', async () => {
  const msg: any = {
    author: { id: '1', tag: 'test#1234' },
    channel: { send: jest.fn() },
    delete: jest.fn(),
  };

  await pointsHandler(msg);

  expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
});
