import type {
  DMChannel,
  Guild,
  Message,
  MessageOptions,
  MessagePayload,
  TextChannel,
  ThreadChannel} from 'discord.js';
import {
  MessageActionRow,
  MessageButton,
  MessageEmbed
} from 'discord.js';

import type { CommandDataWithHandler } from '../../../../types';
import { SERVER_ID, MOD_ROLE_ID, DM_ALT_CHANNEL_ID } from '../../../env';
import { DMThread } from '../db/dm_thread';
import { ModMailThread } from '../db/modmail_thread';
import { COLOR_DELETED_MSG, COLOR_MOD } from '../util/colors';

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

    if (!modmailThread) {
      interaction.editReply({ content: 'Could not find modmail thread' });
      return;
    }
    if (modmailThread.closedAt) {
      interaction.editReply({
        content:
          'This modmail thread is closed, no messages can be sent through this thread anymore to the user. It remains open to allow for discussions.',
      });
      return;
    }

    const user = await interaction.guild.members.fetch(modmailThread.userId);
    const dmChannel = await user.createDM();
    const msgContent = interaction.options.get('message').value;

    const dmMsgContent = {
      embeds: [
        new MessageEmbed()
          .setColor(COLOR_MOD)
          .setAuthor({
            name: `A Moderator`,
          })
          .setDescription(msgContent as string)
          .setTitle('Message Received')
          .setTimestamp(interaction.createdTimestamp),
      ],
    };

    try {
      const dmMsg = await sendDm(interaction.guild, dmChannel, dmMsgContent);

      interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setColor(0x00_f0_50)
            .setAuthor({
              name: `${interaction.user.username}#${interaction.user.discriminator}`,
              iconURL: interaction.user.avatarURL(),
            })
            .setDescription(msgContent as string)
            .setTitle('Message Sent')
            .setTimestamp(interaction.createdTimestamp),
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel('Delete Msg')
              .setCustomId(['DELETE_MODMAIL', user.id, dmMsg.id].join('🤔'))
              .setStyle('DANGER')
          ),
        ],
      });
    } catch (error) {
      console.error(error)
    }
  },
  onAttach(client) {
    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton()) {
        return;
      }

      const [type, userId, msgId] = interaction.customId.split('🤔');

      if (type !== 'DELETE_MODMAIL') {
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      const member = await interaction.guild.members.fetch(userId);

      if (!member) {
        interaction.editReply('The user could not be found in the server.');
        return;
      }

      const dmChannel = await member.createDM();
      const message = await dmChannel.messages.fetch(msgId);
      try {
        await message.delete();
        if ('edit' in interaction.message) {
          interaction.message.edit({
            content: `*The message below was deleted by <@${
              interaction.user.id
            }> at <t:${Math.floor(Date.now() / 1000)}>*`,
            embeds: [interaction.message.embeds[0].setColor(COLOR_DELETED_MSG)],
            components: [],
          });
          interaction.message.react('🗑');
        }
        interaction.editReply(
          'Message deleted, the message will remain here for auditings sake'
        );
      } catch {
        interaction.editReply('Failed to delete the message.');
      }
    });
  },
};
async function sendDm(
  guild: Guild,
  dmChannel: DMChannel,
  msgContent: string | MessagePayload | MessageOptions
) {
  try {
    return await dmChannel.send(msgContent);
  } catch {
    return sendFakeDM(guild, dmChannel, msgContent);
  }
}

async function sendFakeDM(
  guild: Guild,
  dmChannel: DMChannel,
  content: string | MessagePayload | MessageOptions
): Promise<Message> {
  const userId = dmChannel.recipient.id;

  const dmThread = await DMThread.findOneAndUpdate(
    {
      guildId: guild.id,
      userId,
    },
    {
      channelId: DM_ALT_CHANNEL_ID,
    },
    { upsert: true, new: true }
  ).exec();

  console.log(dmThread)

  const channel = (await guild.channels.fetch(
    dmThread.channelId
  )) as TextChannel;
  let thread: ThreadChannel;

  if (dmThread.threadId) {
    thread = await channel.threads.fetch(dmThread.threadId);
  } else {
    try {
    thread = await channel.threads.create({
      name: `${dmChannel.recipient.username}_${dmChannel.recipient.discriminator} [${userId}]`,
      type: 'GUILD_PRIVATE_THREAD',
    });
  } catch {
    thread = await channel.threads.create({
      name: `${dmChannel.recipient.username}_${dmChannel.recipient.discriminator} [${userId}]`,
      type: 'GUILD_PUBLIC_THREAD',
    });
  }

    dmThread.updateOne({ threadId: thread.id }).exec();
  }

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return thread.send(typeof content === 'string' ? `${dmChannel.recipient} ${content}` : { content: `${dmChannel.recipient} ${(content as {content?: string }).content ?? ''}`, ...content})
}
