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
import { jquery } from '../about/handlers/jquery';
import { modules } from '../about/handlers/modules';
import { sass } from '../about/handlers/sass';
import { vscode } from '../about/handlers/vscode';

const aboutMessages: Map<string, string> = new Map([
  jquery,
  vscode,
  modules,
  sass,
]);

const shitpostReplacements = {
  jquery: /jquery/giu,
  vscode: /visual studio code|vscode/giu,
  modules: /module/giu,
  sass: /sass|scss/giu,
};

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

const shitpostInteraction: CommandData = {
  description:
    'Quick response for common "why" or "Tell me about..." questions',
  handler: async (client: Client, interaction: Interaction) => {
    const content = aboutMessages.get(interaction.data.options[0].value);

    if (content) {
      const shitpostContent = content.replace(
        shitpostReplacements[interaction.data.options[0].value],
        interaction.data.options[1].value
      );
      await createInteractionResponse(
        client,
        interaction.guild_id,
        interaction,
        {
          data: {
            data: {
              content: shitpostContent,
            },
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          },
        }
      );
    }
  },
  name: 'shitpost',
  options: [
    {
      choices: [...mapTransformToChoices(aboutMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
    {
      name: 'replacement',
      description: 'Replacement word to use',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
  ],
};

registerCommand(shitpostInteraction);
