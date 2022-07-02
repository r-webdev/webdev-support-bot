import { CommandDataWithHandler } from '../../../../types';
import { SERVER_ID } from '../../../env';
import { beginOnboarding } from './onboardingBegin';
import { setupOnboardingMsg } from './onboardingMsg';
import { setupRoles } from './roles';

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
      case 'onboarding.begin':
        beginOnboarding(interaction);
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
        { name: 'begin', type: 'SUB_COMMAND', description: 'For now... debug' },
      ],
    },
  ],
};
