import type { Message } from 'discord.js';

import { applicationCommands, guildCommands } from '../commands/index.js';

const diffCommands = new Map(
  Object.entries({
    jquery: 'about jquery',
    vscode: 'about vscode',
    modules: 'about modules',
    flexbox: 'about flexbox',
    lockfile: 'about lockfile',
    formatting: 'please format',
    format: 'please format',
    code: 'please code',
    leaderboard: 'points leaderboard',
  })
);

const regex = new RegExp(
  `^!(${[
    ...new Set([
      ...applicationCommands.keys(),
      ...guildCommands.keys(),
      ...diffCommands.keys(),
    ]),
  ].join('|')})(?: |$)`,
  'iu'
);

export function handleDeprecatedCommands(msg: Message): boolean {
  const match = regex.exec(msg.content);
  if (match) {
    const [, command] = match;
    const cmd = command.toLowerCase();

    msg.reply(
      `It looks like you're attempting to use a command. The web dev bot commands are now using the discord slash commands. Give \`/${
        diffCommands.get(cmd) ?? cmd
      }\` a go!`
    );
    return true;
  }
  return false;
}
