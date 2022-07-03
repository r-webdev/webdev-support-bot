import type { CommandDataWithHandler } from '../../../../types';
import { SERVER_ID } from '../../../env.js';
import { handleAddRemoveRole } from '../events/handleAddRemoveRole.js';
import { handleAutoCompleteRole } from '../events/handleAutoCompleteRole.js';
import { change } from './change.js';
import { suggest } from './suggest.js';

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
