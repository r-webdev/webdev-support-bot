import handleCodeRequest from '.';

test('shows why jQuery is awful', async () => {
  const sendMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
  };

  await handleCodeRequest(msg);
  const jqueryBad = msg.channel.send.mock.calls[0][0];
  expect(jqueryBad).toMatchSnapshot();
});
