import {
  CommandInteraction,
  GuildMember,
} from 'discord.js';
import { getAddRemoveRoles } from '../utils/getAddRemoveRoles';
import { generateRoleSelect } from '../utils/generateRoleSelect';

export function change(interaction: CommandInteraction) {
  const [addRoles, removeRoles] = getAddRemoveRoles(interaction.member as GuildMember)
  interaction.reply({
    ephemeral: true,
    content: 'Please select the roles you wish to add or remove',
    components: [
      addRoles.length && generateRoleSelect('Which roles would you like to join?', 'roles🤔add', addRoles),
      removeRoles.length && generateRoleSelect('Which roles would you like to leave?', 'roles🤔remove', removeRoles),
    ].filter(Boolean),
  });
}
