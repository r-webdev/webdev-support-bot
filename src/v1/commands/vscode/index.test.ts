import handleVSCodeRequest from '.';

test('inform users that visual studio code is great and free', async () => {
  const sendMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    client: {
      emojis: {
        cache: [':vscode:'],
      },
    },
  };

  await handleVSCodeRequest(msg);
  expect(msg.channel.send.mock.calls[0][0]).toMatchSnapshot();
});
