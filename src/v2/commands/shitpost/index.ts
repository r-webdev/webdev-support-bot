import type { ApplicationCommandOptionChoice, Client } from 'discord.js';

import type { CommandDataWithHandler } from '../../../types';
import { ADMIN_ROLE_ID, HELPFUL_ROLE_ID, MOD_ROLE_ID, SERVER_ID } from '../../env';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { flexbox } from '../about/handlers/flexbox';
import { lockfile } from '../about/handlers/lockfile';
import { modules } from '../about/handlers/modules';
import { vscode } from '../about/handlers/vscode';
import { code } from '../please/handlers/code';
import { format } from '../please/handlers/format';
import { jquery } from '../whyno/handlers/jquery';

const aboutMessages = new Map<string, ValueOrNullary<string>>([
  jquery,
  vscode,
  modules,
  format,
  code,
  flexbox,
  lockfile,
]);

const shitpostReplacements = {
  jquery: /jquery/giu,
  vscode: /visual studio code|vscode/giu,
  modules: /module/giu,
  sass: /sass|scss/giu,
  format: /code|sql/giu,
  code: /code/giu,
  flexbox: /flexbox/giu,
  lockfile: /lockfile|package|node/giu,
};

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

export const shitpostInteraction: CommandDataWithHandler = {
  description:
    'A fun little shitpost command using some of the about/please commands',
  guildValidate: guild => guild.id === SERVER_ID,
  handler: async (client, interaction) => {
    const topic = interaction.options.getString('topic');
    const replacement = interaction.options.getString('replacement');
    const content = aboutMessages.get(topic);
    const roles = interaction.member.roles;

    if(canUseCommand(roles)){
      await interaction.reply({ephemeral: true, content: "This is only available to helpful members"})
    }

    if (replacement.match(/<@[!&]?\d+>/)) {
      await interaction.reply({
        content: "Please don't try to tag users with this feature!",
        ephemeral: true,
      });
      return
    }

    if (content) {
      const shitpostContent = valueOrCall(content).replace(
        shitpostReplacements[topic],
        replacement
      );
      interaction.reply(shitpostContent);
    }
  },
  name: 'shitpost',
  options: [
    {
      choices: [...mapTransformToChoices(aboutMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: 'STRING',
    },
    {
      name: 'replacement',
      description: 'Replacement word to use',
      required: true,
      type: 'STRING',
    },
  ],
};

function canUseCommand(roles) {
  if (Array.isArray(roles)) {
    if (![HELPFUL_ROLE_ID, MOD_ROLE_ID, ADMIN_ROLE_ID].some(role => roles.includes(role))) {
      return true;
    }
  } else {
    return ![HELPFUL_ROLE_ID, MOD_ROLE_ID, ADMIN_ROLE_ID].some(role => roles.cache.has(HELPFUL_ROLE_ID))
  }
  return false;
}
