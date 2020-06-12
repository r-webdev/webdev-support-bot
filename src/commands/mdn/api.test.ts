import { updatedQueryBuilder } from './api';

import useData from '../../utils/useData';
import { getChosenResult } from '../../utils/discordTools';

const searchResponse = {
  query: 'document',
  locale: 'en-US',
  page: 1,
  pages: 383,
  start: 1,
  end: 10,
  next:
    'https://developer.mozilla.org/api/v1/search/en-US?highlight=false&page=2&q=document',
  previous: null,
  count: 3823,
  filters: [
    {
      name: 'Topics',
      slug: 'topic',
      options: [
        {
          name: 'APIs and DOM',
          slug: 'api',
          count: 2609,
          active: true,
          urls: {
            active: '/api/v1/search/en-US?highlight=false&q=document&topic=api',
            inactive: '/api/v1/search/en-US?highlight=false&q=document',
          },
        },
      ],
    },
  ],
  documents: [
    {
      title: 'Document directive',
      slug: 'Glossary/Document_directive',
      locale: 'en-US',
      excerpt:
        'CSP document directives are used in a Content-Security-Policy header and govern the properties of a document or worker environment to which a policy applies.',
    },
    {
      title: 'document environment',
      slug: 'Glossary/document_environment',
      locale: 'en-US',
      excerpt:
        "When the JavaScript global environment is a window or an iframe, it is called a document environment. A global environment is an environment that doesn't have an outer environment.",
    },
    {
      title: 'DOM (Document Object Model)',
      slug: 'Glossary/DOM',
      locale: 'en-US',
      excerpt:
        'The DOM (Document Object Model) is an API that represents and interacts with any HTML or XML document. The DOM is a document model loaded in the browser and representing the document as a node tree, where each node represents part of the document (e.g. an element, text string, or comment).',
    },
    {
      title: 'Archived open Web documentation',
      slug: 'Archive/Web',
      locale: 'en-US',
      excerpt:
        'The documentation listed below is archived, obsolete material about open Web topics.',
    },
    {
      title: 'Document.documentElement',
      slug: 'Web/API/Document/documentElement',
      locale: 'en-US',
      excerpt:
        'Document.documentElement returns the Element that is the root element of the document (for example, the html element for HTML documents).',
    },
    {
      title: 'Document.documentURI',
      slug: 'Web/API/Document/documentURI',
      locale: 'en-US',
      excerpt:
        'The documentURI read-only property of the Document interface returns the document location as a string.',
    },
    {
      title: 'Document.documentURIObject',
      slug: 'Web/API/Document/documentURIObject',
      locale: 'en-US',
      excerpt:
        'The Document.documentURIObject read-only property returns an nsIURI object representing the URI of the document.',
    },
    {
      title: 'Document',
      slug: 'Web/API/Document',
      locale: 'en-US',
      excerpt:
        "The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree.",
    },
    {
      title: 'Document()',
      slug: 'Web/API/Document/Document',
      locale: 'en-US',
      excerpt:
        "The Document constructor creates a new Document object that is a web page loaded in the browser and serving as an entry point into the page's content.",
    },
    {
      title: '@document',
      slug: 'Web/CSS/@document',
      locale: 'en-US',
      excerpt:
        'The @document CSS at-rule restricts the style rules contained within it based on the URL of the document. It is designed primarily for user-defined style sheets, though it can be used on author-defined style sheets, too.',
    },
  ],
};

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
