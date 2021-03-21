import type {
  ApplicationCommandOptionChoice,
  Client,
  Interaction,
} from 'discord.js';

import {
  InteractionResponseType,
  ApplicationCommandOptionType,
} from '../../../enums';
import type { CommandData } from '../../interactions';
import { registerCommand } from '../../interactions';
import { createInteractionResponse } from '../../interactions';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { code } from './handlers/code';
import { flexbox } from './handlers/flexbox';
import { formatting } from './handlers/formatting';
import { jquery } from './handlers/jquery';
import { lockfile } from './handlers/lockfile';
import { modules } from './handlers/modules';
import { sass } from './handlers/sass';
import { vscode } from './handlers/vscode';

const aboutMessages = new Map<string, ValueOrNullary<string>>([
  jquery,
  vscode,
  modules,
  sass,
  formatting,
  code,
  flexbox,
  lockfile,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

const aboutInteraction: CommandData = {
  description:
    'Quick response for common "why" or "Tell me about..." questions',
  handler: async (client: Client, interaction: Interaction) => {
    const content = aboutMessages.get(interaction.data.options[0].value);

    if (content) {
      await createInteractionResponse(
        client,
        interaction.guild_id,
        interaction,
        {
          data: {
            data: {
              content: valueOrCall(content),
            },
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          },
        }
      );
    }
  },
  name: 'about',
  options: [
    {
      choices: [...mapTransformToChoices(aboutMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
  ],
};

registerCommand(aboutInteraction);
