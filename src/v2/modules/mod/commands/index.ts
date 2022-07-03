import type { CommandDataWithHandler } from '../../../../types';
import { SERVER_ID } from '../../../env.js';
import { debugOnboarding } from './onboardingBegin.js';
import { setupOnboardingMsg } from './onboardingMsg.js';
import { setupRoles } from './roles.js';

export const setupCommands: CommandDataWithHandler = {
  name: 'setup',
  description: 'Setup Commands',
  async handler(client, interaction) {
    const cmd = [
      interaction.options.getSubcommandGroup(),
      interaction.options.getSubcommand(),
    ].join('.');
    switch (cmd) {
      case 'roles.message':
        await setupRoles(interaction);
        break;
      case 'onboarding.debug':
        debugOnboarding(interaction);
        break;

      case 'onboarding.message':
        setupOnboardingMsg(interaction);
        break;
    }
  },
  guildValidate: guild => guild.id === SERVER_ID,
  defaultPermission: false,
  options: [
    {
      name: 'roles',
      type: 'SUB_COMMAND_GROUP',
      description: 'Post the role change post here',
      options: [
        {
          name: 'message',
          type: 'SUB_COMMAND',
          description: 'Post the onboarding command here',
        },
      ],
    },
    {
      name: 'onboarding',
      type: 'SUB_COMMAND_GROUP',
      description: 'onboarding setup commands',
      options: [
        {
          name: 'message',
          type: 'SUB_COMMAND',
          description: 'Post the onboarding command here',
        },
        { name: 'debug', type: 'SUB_COMMAND', description: 'For now... debug info' },
      ],
    },
  ],
};
