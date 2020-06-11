import handleFormattingRequest from '.';

test(`informs people who can't bother to ask their questions properly on how to do it right`, async () => {
  const sendMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
  };

  await handleFormattingRequest(msg);
  expect(msg.channel.send).toHaveBeenCalledWith(
    expect.stringContaining('Did you know you can add')
  );
});
