import type {
  ApplicationCommandOptionChoiceData,
  Client,
  CommandInteraction,
} from 'discord.js';

import type { CommandDataWithHandler } from '../../../types';
import { map } from '../../utils/map.js';
import type { ValueOrNullary } from '../../utils/valueOrCall.js';
import { valueOrCall } from '../../utils/valueOrCall.js';
import { flexbox } from './handlers/flexbox.js';
import { lockfile } from './handlers/lockfile.js';
import { modules } from './handlers/modules.js';
import { vscode } from './handlers/vscode.js';

const aboutMessages = new Map<string, ValueOrNullary<string>>([
  vscode,
  modules,
  flexbox,
  lockfile,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoiceData => ({
    name: item,
    value: item,
  })
);

export const aboutInteraction: CommandDataWithHandler = {
  name: 'about',
  options: [
    {
      choices: [...mapTransformToChoices(aboutMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: 'STRING',
    },
    {
      name: 'tag',
      description: 'Optional Person to Tag',
      type: 'USER',
    },
  ],
  description:
    'Quick response for common "why" or "Tell me about..." questions',
  handler: async (
    client: Client,
    interaction: CommandInteraction
  ): Promise<void> => {
    const topic = interaction.options.get('topic').value as string;
    const user = interaction.options.getUser('tag');
    const content = aboutMessages.get(topic);

    if (content) {
      interaction.reply(
        `${user ? `${user.toString()}\n` : ''} ${valueOrCall(content).trim()}`
      );
      return;
    }

    interaction.reply(`An error occured when trying to call \`/about ${topic}`);
  },
};
