import type {
  ApplicationCommandOptionChoice,
  Client,
  Interaction,
} from 'discord.js';

import type { CommandData } from '../../interactions';
import { createInteractionResponse } from '../../interactions';
import { map } from '../../utils/map';
import { code } from './handlers/code';
import { formatting } from './handlers/formatting';
import { lockfile } from './handlers/packagelock';

export const howMessages: Map<string, string> = new Map([
  lockfile,
  formatting,
  code,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

export const createHowInteractionHandler = (client: Client): CommandData => ({
  description: 'quick response for common "How" questions',
  handler: async (interaction: Interaction): Promise<void> => {
    const content = howMessages.get(interaction.data.options[0].value);
    if (content) {
      // eslint-disable-next-line no-void
      void createInteractionResponse(
        client,
        interaction.guild_id,
        interaction,
        {
          data: {
            data: {
              content,
            },
            type: 4,
          },
        }
      );
    }
  },
  name: 'how',
  options: [
    {
      choices: [...mapTransformToChoices(howMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: 3,
    },
  ],
});
