import leaderboardHandler from '.';

test('retuns with sample leaderboard message', async () => {
  const msg: any = {
    channel: { send: jest.fn() },
    delete: jest.fn(),
  };

  await leaderboardHandler(msg, 0);

  expect(msg.channel.send.mock.calls[0]).toMatchSnapshot();
});
