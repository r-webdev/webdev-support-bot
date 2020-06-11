import { updatedQueryBuilder } from './api';

import { searchResponse } from './__fixtures__/responses';
import useData from '../../utils/useData';
import { getChosenResult } from '../../utils/discordTools';

describe('updatedMDNQuery', () => {
  const mockUseData: jest.MockedFunction<typeof useData> = jest.fn();
  const mockChoose: jest.MockedFunction<typeof getChosenResult> = jest.fn();

  const editMsg = {
    edit: jest.fn(),
  };
  const sendMock = jest.fn();
  const replyMock = jest.fn();
  const msg: any = {
    channel: { send: sendMock },
    reply: replyMock,
  };

  test('should work', async () => {
    mockUseData.mockResolvedValueOnce({
      error: false,
      text: null,
      json: searchResponse,
    });

    mockChoose.mockResolvedValueOnce({
      title: 'DOM (Document Object Model)',
      slug: 'Glossary/DOM',
      locale: 'en-US',
      excerpt:
        'The DOM (Document Object Model) is an API that represents and interacts with any HTML or XML document. The DOM is a document model loaded in the browser and representing the document as a node tree, where each node represents part of the document (e.g. an element, text string, or comment).',
    });

    sendMock.mockResolvedValue(editMsg);
    const handler = updatedQueryBuilder(mockUseData, mockChoose);

    await handler(msg, 'Search Term');
    expect(msg.channel.send.mock.calls).toMatchSnapshot();
    expect(editMsg.edit.mock.calls).toMatchSnapshot();
  });
});
