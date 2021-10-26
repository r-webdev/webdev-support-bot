import type { ApplicationCommandOptionChoice, Client, CommandInteraction } from 'discord.js';

import type { CommandDataWithHandler } from '../../../types';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { code } from './handlers/code';
import { format } from './handlers/format';
import { justAsk } from './handlers/justAsk';


const pleaseMessages = new Map<string, ValueOrNullary<string>>([format, code, justAsk]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

export const pleaseInteraction: CommandDataWithHandler = {
  name: 'please',
  description: 'Quick response for asking someone to please use something',
  handler: async (client: Client, interaction: CommandInteraction) => {
    const content = pleaseMessages.get(interaction.options.getString('topic'));
    const user = interaction.options.getUser('user');

    if (content) {
      await interaction.reply(
        `${user ? `${user}\n` : ''}${valueOrCall(content).trim()}`
      );
    }
  },
  options: [
    {
      name: 'topic',
      description: 'The topic to ask about',
      choices: [...mapTransformToChoices(pleaseMessages.keys())],
      required: true,
      type: 'STRING',
    },
    {
      name: 'user',
      description: 'Optional Person to Tag',
      type: 'USER',
    },
  ],
};
