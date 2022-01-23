import type { CommandDataWithHandler } from "../../../../types";
import { SERVER_ID } from "../../../env";

export const reportUser: CommandDataWithHandler = {
  type: 'USER',
  name: 'Report User To Mods',
  guildValidate: guild => guild.id === SERVER_ID,
  async handler(client, interaction) {
    if (!interaction.isContextMenu()) {
      return;
    }

    if (interaction.targetType !== 'USER') {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const user = await interaction.guild.members.fetch({
      user: interaction.targetId,
    });

    await interaction.editReply({
      content: `Would you like to report ${user}?`,
    });
  },
};
