import type { ApplicationCommandOptionChoice, Client, CommandInteraction } from 'discord.js';

import { ApplicationCommandOptionType } from '../../../enums.js';
import type { CommandDataWithHandler } from '../../../types';
import { map } from '../../utils/map.js';
import type { ValueOrNullary } from '../../utils/valueOrCall.js';
import { valueOrCall } from '../../utils/valueOrCall.js';
import { javascript } from './handlers/javascript.js';

const resourceMessages = new Map<string, ValueOrNullary<{ content: string }>>([
  javascript,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

export const resourceInteraction: CommandDataWithHandler = {
  description: 'Quick response for asking someone to please use something',
  handler: async (client: Client, interaction: CommandInteraction) => {
    const content = resourceMessages.get(interaction.options.getString('for'));

    if (content) {
      interaction.reply(valueOrCall(content));
    }
  },
  name: 'resource',
  options: [
    {
      choices: [...mapTransformToChoices(resourceMessages.keys())],
      description: 'what are you looking to find resources for',
      name: 'for',
      required: true,
      type: 'STRING',
    },
  ],
};
