import { dbConnect } from '../..';

import pointsCommandHandler from '.';

beforeAll(() => dbConnect());

test('should throw an error if no user has been found', async () => {
  const msg: any = {
    author: { id: '1', tag: 'test#1234' },
    channel: { send: jest.fn() },
    content: '!points',
    delete: jest.fn(),
  };

  await pointsCommandHandler(msg);

  expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
});
