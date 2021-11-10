import type {
  ApplicationCommandOptionChoice,
  Client,
  CommandInteraction,
  Interaction,
} from 'discord.js';

import type { CommandDataWithHandler } from '../../../types';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { flexbox } from './handlers/flexbox';
import { lockfile } from './handlers/lockfile';
import { modules } from './handlers/modules';
import { vscode } from './handlers/vscode';

const aboutMessages = new Map<string, ValueOrNullary<string>>([
  vscode,
  modules,
  flexbox,
  lockfile,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
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
        `${user ? `${user}\n` : ''} ${valueOrCall(content).trim()}`
      );
      return;
    }

    interaction.reply(`An error occured when trying to call \`/about ${topic}`);
  },
};
