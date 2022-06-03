import type { ApplicationCommandOptionChoiceData, Client, CommandInteraction } from 'discord.js';

import type { CommandDataWithHandler } from '../../../types';
import { map } from '../../utils/map.js';
import type { ValueOrNullary } from '../../utils/valueOrCall.js';
import { valueOrCall } from '../../utils/valueOrCall.js';
import { channel } from './handlers/channel.js';
import { jquery } from './handlers/jquery.js';

const whynoMessages = new Map<string, ValueOrNullary<string>>([
  jquery,
  channel
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoiceData => ({
    name: item,
    value: item,
  })
);

export const whynoInteraction: CommandDataWithHandler = {
  description:
    'Quick response for common "why no" or "why not..." questions',
  handler: async (client: Client, interaction: CommandInteraction): Promise<void> => {
    const topic = interaction.options.get('topic').value as string;
    const user = interaction.options.getUser('tag');
    const content = whynoMessages.get(topic);

    if (content) {
      interaction.reply(
        `${user ? `${user}\n` : ''} ${valueOrCall(content).trim()}`
      );
      return;
    }

    interaction.reply(`An error occured when trying to call \`/whyno ${topic}`);
  },
  name: 'whyno',
  options: [
    {
      choices: [...mapTransformToChoices(whynoMessages.keys())],
      description: 'The topic in question',
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
};
