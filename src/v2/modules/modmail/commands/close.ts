import type { ThreadChannel } from "discord.js";

import type { CommandDataWithHandler } from "../../../../types";
import { SERVER_ID, MOD_ROLE_ID } from "../../../env";
import { ModMailThread } from "../db/modmail_thread";
import { cache } from "../util/cache";

export const closeCommand: CommandDataWithHandler = {
  type: "CHAT_INPUT",
  description: 'Close a modmail thread',
  name: "close",
  options: [
    {
      name: 'reason',
      description: "Reason or note regarding the closing of the modmail thread",
      type: "STRING"
    }
  ],
  guildValidate: guild => guild.id === SERVER_ID,
  defaultPermission: false,
  async managePermissions(guild, permissions) {
    await permissions.add({
      guild,
      permissions: [
        {
          id: MOD_ROLE_ID,
          type: 'ROLE',
          permission: true,
        },
      ],
    });
  },
  async handler(client, interaction) {
    const [modmailThread] = await Promise.all([
      ModMailThread.findOne({ threadId: interaction.channel.id }),
      interaction.deferReply(),
    ]);

    if(!modmailThread) {
      interaction.editReply({ content: "Could not find modmail thread" })
      throw new Error("Could not find modmail thread")
    }

    if(modmailThread.closedAt) {
      interaction.editReply({ content: "This modmail thread is already closed" })
      return
    }

    const thread = interaction.channel as ThreadChannel

    await thread.setName(`✅ ${thread.name.replace(/^✅ /u, '')}`);

    await thread.setArchived(true);

    cache.del(`${modmailThread.guildId}|${modmailThread.userId}`);
    cache.del(modmailThread.threadId);

    await modmailThread.updateOne({
      closedAt: Date.now()
    }).exec();


    const reason = interaction.options.get('reason')?.value as string

    interaction.editReply({
      content: ["Modmail Thread Closed.", reason? `Note/Reason: ${reason}` : null].filter(Boolean).join('\n'),
    })
  }
}
