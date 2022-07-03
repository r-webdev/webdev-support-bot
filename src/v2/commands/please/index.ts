import type {
  ApplicationCommandOptionChoiceData,
  Client,
  CommandInteraction,
} from 'discord.js';

import type { CommandDataWithHandler } from '../../../types';
import { map } from '../../utils/map.js';
import type { ValueOrNullary } from '../../utils/valueOrCall.js';
import { valueOrCall } from '../../utils/valueOrCall.js';
import { code } from './handlers/code.js';
import { english } from './handlers/english.js';
import { format } from './handlers/format/index.js';
import { justAsk } from './handlers/justask.js';

const pleaseMessages = new Map<string, ValueOrNullary<string>>([
  format,
  code,
  justAsk,
  english,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoiceData => ({
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
        `${user ? `${user.toString()}\n` : ''}${valueOrCall(content).trim()}`
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
