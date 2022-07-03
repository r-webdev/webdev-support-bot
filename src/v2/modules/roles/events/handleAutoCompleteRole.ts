import type { Interaction } from 'discord.js';

import { ROLES } from '../consts/roles.js';

export const handleAutoCompleteRole = async (
  interaction: Interaction
): Promise<void> => {
  if (interaction.isAutocomplete()) {
    const focused = interaction.options.getFocused();
    const listedRoles = ROLES.filter(roles =>
      roles.name.toLowerCase().includes(focused.toLowerCase())
    );

    await interaction.respond(
      listedRoles.map(x => ({
        name: x.name,
        value: x.name,
      }))
    );
  }
};
