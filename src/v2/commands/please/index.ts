import type {
  ApplicationCommandOptionChoice,
  Client,
  InteractionObject,
} from 'discord.js';

import {
  InteractionResponseType,
  ApplicationCommandOptionType,
} from '../../../enums';
import type { CommandData, Interaction } from '../../interactions';
import { registerCommand } from '../../interactions';
import { createInteractionResponse } from '../../interactions';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { code } from './handlers/code';
import { format } from './handlers/format';

const pleaseMessages = new Map<string, ValueOrNullary<string>>([format, code]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

const pleaseInteraction: CommandData = {
  description: 'Quick response for asking someone to please use something',
  handler: async (client: Client, interaction: Interaction) => {
    const content = pleaseMessages.get(interaction.data.options[0].value);

    if (content) {
      await interaction.reply(valueOrCall(content));
    }
  },
  name: 'please',
  options: [
    {
      choices: [...mapTransformToChoices(pleaseMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
  ],
};

registerCommand(pleaseInteraction);
