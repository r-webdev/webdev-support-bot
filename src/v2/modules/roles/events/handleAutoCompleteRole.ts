import { ROLES } from "../consts/roles";

export const handleAutoCompleteRole =  async interaction => {
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
}
