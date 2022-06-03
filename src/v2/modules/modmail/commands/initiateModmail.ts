import type { GuildMember} from "discord.js";

import type { CommandDataWithHandler } from "../../../../types";
import { SERVER_ID, MOD_ROLE_ID } from "../../../env";
import { createModMailThread } from "../util/createModMailThread";
import { createReporteeEmbed, createInitialEmbed, createInitiatorEmbed } from "../util/embeds";


export const initiateModmail: CommandDataWithHandler = {
  type: 'USER',
  name: 'Initiate Modmail',
  guildValidate: guild => guild.id === SERVER_ID,
  async handler(client, interaction) {
    if (!interaction.isUserContextMenu()) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const thread = await createModMailThread(
      interaction.guild,
      interaction.targetUser
    );

    const initialMsg = await thread.send({
      content: `<@&${MOD_ROLE_ID}>`,
      embeds: [
        createInitialEmbed(),
        createInitiatorEmbed(interaction.member as GuildMember),
        createReporteeEmbed(interaction.targetMember as GuildMember),
      ],
    });

    await initialMsg.pin();
    interaction.editReply({
      content: `Created thread <#${thread.id}>`
    })
  },
};
