import type { CommandInteraction, GuildMember } from 'discord.js';

import { generateRoleSelect } from '../utils/generateRoleSelect.js';
import { getAddRemoveRoles } from '../utils/getAddRemoveRoles.js';

export function change(interaction: CommandInteraction): void {
  const [addRoles, removeRoles] = getAddRemoveRoles(
    interaction.member as GuildMember
  );
  interaction.reply({
    ephemeral: true,
    content: 'Please select the roles you wish to add or remove',
    components: [
      addRoles.length > 0 &&
        generateRoleSelect(
          'Which roles would you like to join?',
          'roles🤔add',
          addRoles
        ),
      removeRoles.length > 0 &&
        generateRoleSelect(
          'Which roles would you like to leave?',
          'roles🤔remove',
          removeRoles
        ),
    ].filter(Boolean),
  });
}
