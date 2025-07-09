import { collect } from 'domyno';

import { map } from '../../../utils/map.js';
import { pipe } from '../../../utils/pipe.js';

const BACKTICKS = '```';

type ResourceDescription = {
  title: string;
  url: string;
  description: string;
};

const mapTransform = map<ResourceDescription, string>(
  ({ title, url, description }) =>
    `
**${title}** - <${url}>
${BACKTICKS}
${description}
${BACKTICKS}
`.trim()
);

const transform = pipe(mapTransform, collect, arr => arr.join('\n'));

const resources = [
  {
    title: 'Javascript.Info',
    url: 'https://javascript.info',
    description:
      'A beginners guide to Javascript, setup like a course and completely free',
  },
  {
    title: 'Mozilla Developer Network (MDN)',
    url: 'https://developer.mozilla.org/en-US/docs/Web/',
    description: 'Unofficial Web Documentation, completely free',
  },
];

export const javascript: [string, { content: string }] = [
  'javascript',
  {
    content: `
**Javascript Resources**
Below is a set of useful javascript resources
---
${transform(resources)}`,
  },
];
