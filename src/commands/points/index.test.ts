import { dbConnect } from '../..';

import pointsHandler from '.';

test('should throw an error if no user has been found', async () => {
  // Connect to database
  dbConnect();

  const msg: any = {
    author: { id: '1', tag: 'test#1234' },
    channel: { send: jest.fn() },
    delete: jest.fn(),
  };

  await pointsHandler(msg);

  expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
});
