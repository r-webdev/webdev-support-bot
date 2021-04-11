import type { ApplicationCommandOptionChoice, Client } from 'discord.js';

import { ApplicationCommandOptionType } from '../../../enums';
import type { CommandData, Interaction } from '../../interactions';
import { registerCommand } from '../../interactions';
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
  name: 'please',
  description: 'Quick response for asking someone to please use something',
  handler: async (client: Client, interaction: Interaction) => {
    const content = pleaseMessages.get(interaction.data.options[0].value);
    const user = interaction.data.options[1]?.value;

    if (content) {
      await interaction.reply(
        `${user ? `<@${user}>\n` : ''}${valueOrCall(content).trim()}`
      );
    }
  },
  options: [
    {
      name: 'topic',
      description: 'The topic to ask about',
      choices: [...mapTransformToChoices(pleaseMessages.keys())],
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
    {
      name: 'user',
      description: 'Optional Person to Tag',
      type: ApplicationCommandOptionType.USER,
    },
  ],
};

registerCommand(pleaseInteraction);
