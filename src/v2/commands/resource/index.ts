import type {
  ApplicationCommandOptionChoice,
  Client,
  Interaction,
  MessageEmbed,
} from 'discord.js';

import {
  InteractionResponseType,
  ApplicationCommandOptionType,
} from '../../../enums';
import type { CommandData } from '../../interactions';
import { registerCommand } from '../../interactions';
import { createInteractionResponse } from '../../interactions';
import { Embed } from '../../utils/discordTools';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { javascript } from './handlers/javascript';

const resourceMessages = new Map<string, ValueOrNullary<{ content: string }>>([
  javascript,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

const pleaseInteraction: CommandData = {
  description: 'Quick response for asking someone to please use something',
  handler: async (client: Client, interaction: Interaction) => {
    const content = resourceMessages.get(interaction.data.options[0].value);

    if (content) {
      await createInteractionResponse(client, interaction, {
        data: {
          data: valueOrCall(content) as { content: string },
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        },
      });
    }
  },
  name: 'resource',
  options: [
    {
      choices: [...mapTransformToChoices(resourceMessages.keys())],
      description: 'what are you looking to find resources for',
      name: 'for',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
  ],
};

registerCommand(pleaseInteraction);
