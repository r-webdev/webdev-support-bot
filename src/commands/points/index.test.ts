import { dbConnect } from '../..';

import pointsCommandHandler from '.';

beforeAll(() => dbConnect());

test('should match the snapshot of a notification stating the user has 0 points', async () => {
  const msg: any = {
    author: { id: '1', tag: 'test#1234' },
    channel: { send: jest.fn() },
    content: '!points',
    delete: jest.fn(),
    guild: { id: '1' },
  };

  await pointsCommandHandler(msg);

  expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
});
