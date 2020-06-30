import { dbConnect } from '../..';

import pointHandler from '.';

beforeAll(() => dbConnect());

test('should throw an error if no user has been found', async () => {
  const msg: any = {
    author: { id: '1', tag: 'test#1234' },
    channel: { send: jest.fn() },
    delete: jest.fn(),
  };

  await pointHandler(msg);

  expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
});
