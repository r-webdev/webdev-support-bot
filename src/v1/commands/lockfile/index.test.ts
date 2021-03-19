import handleCodeRequest from '.';

test('shows how to reset lockfile', async () => {
  const sendMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
  };

  await handleCodeRequest(msg);
  const response = msg.channel.send.mock.calls[0][0];
  expect(response).toMatchSnapshot();
});
