import { LINE_SEPARATOR, exampleFns } from './exampleFns.js';

const getRandomArbitrary = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getSnippetElements = () =>
  [
    '> \\`\\`\\`js',
    '> // copy this and enter your code instead',
    exampleFns[getRandomArbitrary(0, exampleFns.length - 1)]
      .toString()
      .split(LINE_SEPARATOR)
      .map(line => `> ${line}`)
      .join(LINE_SEPARATOR),
    '> \\`\\`\\`',
  ].join(LINE_SEPARATOR);

const otherLanguageExamples = ['php', 'css', 'html', 'ts', 'sql', 'md']
  .map(str => `\`${str}\``)
  .join(', ');

export const format: [string, () => string] = [
  'format',
  (): string => `
👆 Did you know you can add syntax highlighting to your code in Discord?
https://cdn.discordapp.com/attachments/550768098660188191/834795086126121010/2021-04-22_10-16-33.gif
${getSnippetElements()}

You can replace \`js\` with other languages too, e.g. ${otherLanguageExamples} and so on...
To properly _format_ your code, try pasting it in here first: https://prettier.io/playground/
`,
];
