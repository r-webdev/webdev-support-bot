import {
  MessageActionRow,
  MessageSelectMenu
} from 'discord.js';

export function generateRoleSelect(placeholder: string, customId: string, roles: string[]) {
  return new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setOptions(
        roles.map(role => ({ label: role, value: role }))
      )
      .setCustomId(customId)
      .setMinValues(1)
      .setPlaceholder(placeholder)
  );
}
