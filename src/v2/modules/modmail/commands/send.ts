import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";

import type { CommandDataWithHandler } from "../../../../types";
import { SERVER_ID, MOD_ROLE_ID } from "../../../env";
import { ModMailThread } from "../db/modmail_thread";

export const sendCommand: CommandDataWithHandler = {
  type: 'CHAT_INPUT',
  description: 'Send a message (mod mail specific)',
  name: 'send',
  options: [
    {
      name: 'message',
      description: 'Message to send to the user',
      type: 'STRING',
      required: true,
    },
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
      return;
    }
    if (modmailThread.closedAt) {
      interaction.editReply({ content: "This modmail thread is closed, no messages can be sent through this thread anymore to the user. It remains open to allow for discussions."})
      return
    }

    const user = await interaction.guild.members.fetch(modmailThread.userId)
    const dmChannel = await user.createDM()
    const msgContent = interaction.options.get('message').value

    try {
      const dmMsg = await dmChannel.send({
        embeds: [
          new MessageEmbed()
          .setColor(0x00_f0_50)
          .setAuthor({
            name: `A Moderator`,
          })
          .setDescription(msgContent as string)
          .setTitle('Message Received')
          .setTimestamp(interaction.createdTimestamp)
        ]
      })

      interaction.editReply({
        embeds: [
          new MessageEmbed()
          .setColor(0x00_f0_50)
          .setAuthor({
            name: `${interaction.user.username}#${interaction.user.discriminator}`,
            iconURL: interaction.user.avatarURL()
          })
          .setDescription(msgContent as string)
          .setTitle('Message Sent')
          .setTimestamp(interaction.createdTimestamp)
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
            .setLabel("Delete Msg")
            .setCustomId([
              "DELETE_MODMAIL",
              user.id,
              dmMsg.id,
            ].join('🤔'))
            .setStyle("DANGER")
          )
        ]
      })
    } catch {

    }
  },
   onAttach(client) {
     client.on('interactionCreate', async (interaction) => {
        if(!interaction.isButton()) { return }

        const [type, userId, msgId] = interaction.customId.split('🤔')

        if (type !== 'DELETE_MODMAIL') {
          return
        }
        await interaction.deferReply({ ephemeral: true })
        const member = await interaction.guild.members.fetch(userId)

        if(!member) {
          interaction.editReply("The user could not be found in the server.")
          return
        }

        const dmChannel = await member.createDM()
        const message = await dmChannel.messages.fetch(msgId)
        try {
          await message.delete()
          if("edit" in interaction.message) {
            interaction.message.edit({
              content: `*The message below was deleted by <@${interaction.user.id}> at <t:${Date.now()/1000}>*`,
              embeds: [
                interaction.message.embeds[0].setColor(0x90_00_00)
              ],
              components: []
            })
            interaction.message.react("🗑")
          }
          interaction.editReply("Message deleted, the message will remain here for auditings sake")
        } catch {
          interaction.editReply("Failed to delete the message.")
        }
     })
   }

};
