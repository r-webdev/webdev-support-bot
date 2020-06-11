import handleCodeRequest from '.';

test('sandbox replies', async () => {
  const send = jest.fn();
  const msg: any = {
    channel: { send },
  };

  await handleCodeRequest(msg);
  expect(send.mock.calls[0][0]).toMatchSnapshot();
});
