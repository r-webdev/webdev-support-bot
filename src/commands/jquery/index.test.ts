import handleCodeRequest from './index';

test('shows why jQuery is awful', async () => {
  const sendMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
  };

  await handleCodeRequest(msg);
  expect(msg.channel.send).toHaveBeenCalledWith(
    expect.stringContaining('jQuery is a legacy library')
  );
});
