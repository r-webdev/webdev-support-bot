import type { CommandDataWithHandler } from '../../../../types';
import { SERVER_ID } from '../../../env';
import { handleAddRemoveRole } from '../events/handleAddRemoveRole';
import { handleAutoCompleteRole } from '../events/handleAutoCompleteRole';
import { change } from './change';
import { suggest } from './suggest';

export const roleCommands: CommandDataWithHandler = {
  name: 'roles',
  description: 'update your roles',
  async handler(client, interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'suggest':
        await suggest(interaction);
        break;
      case 'change':
        change(interaction);
        break;
    }
  },
  onAttach(client) {
    client.on('interactionCreate', handleAddRemoveRole);

    client.on('interactionCreate', handleAutoCompleteRole);
  },
  guildValidate: guild => guild.id === SERVER_ID,
  defaultPermission: false,
  options: [
    {
      name: 'suggest',
      type: 'SUB_COMMAND',
      description: 'Suggest a role to a user',
      options: [
        {
          name: 'role',
          type: 'STRING',
          description: 'role',
          autocomplete: true,
          required: true,
        },
        {
          name: 'user',
          type: 'USER',
          description: 'The user you want to suggested the roles to',
        },
      ],
    },
    {
      name: 'change',
      type: 'SUB_COMMAND',
      description: 'Change your roles',
    },
  ],
};
