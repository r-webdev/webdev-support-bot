import { vscode as vscode_emoji } from '../../../utils/emojis';

export const vscode: [string, string] = [
  'vscode',
  [
    `> 💡 consider using a lightweight, customizeable and monthly updated editor such as`,
    '> ',
    vscode_emoji
      ? `> ${vscode_emoji} Visual Studio Code - <https://code.visualstudio.com/>`
      : '> Visual Studio Code - <https://code.visualstudio.com/>',
    '> ',
    "> It's free & available cross platform and next to WebStorm the go to editor in this industry.",
  ].join('\n'),
];
