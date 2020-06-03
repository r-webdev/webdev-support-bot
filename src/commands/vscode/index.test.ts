import handleVSCodeRequest from './index';

test('inform users that visual studio code is great and free', async () => {
  const sendMock = jest.fn();
  const msg: any = {
    client: {
      emojis: {
        cache: [':vscode:'],
      },
    },
    channel: { send: sendMock },
  };

  await handleVSCodeRequest(msg);
  expect(msg.channel.send).toBeCalledWith(
    expect.stringContaining('Visual Studio Code')
  );
});
