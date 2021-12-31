import type { APIInteractionGuildMember } from 'discord-api-types';
import type {
  EmbedField,
  GuildMember,
  GuildMemberRoleManager} from 'discord.js';
import {
  DMChannel,
  User,
} from 'discord.js';
import { MessageEmbed } from 'discord.js';

import type { CommandDataWithHandler } from '../../../../types';
import { MOD_ROLE_ID, SERVER_ID } from '../../../env.js';
import { ModMailThread } from '../db/modmail_thread';
import { createModMailThread } from '../util/createModMailThread';

const sendCommand: CommandDataWithHandler = {
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
  async handler(client, interaction) {
    const [modmailThread] = await Promise.all([
      ModMailThread.findOne({ threadId: interaction.channel.id }),
      interaction.deferReply(),
    ]);

    if(!modmailThread) {
      interaction.editReply({ content: "Could not find modmail thread" })
      throw new Error("Could not find modmail thread")
    }
    const user = await interaction.guild.members.fetch(modmailThread.userId)
    const dmChannel = await user.createDM()

    try {
      dmChannel.send({
        embeds: [
          new MessageEmbed()
          .setColor(0x00_f0_50)
          .setAuthor({
            name: `A Moderator`,
          })
          .setDescription(interaction.options.get('message').value as string)
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
          .setDescription(interaction.options.get('message').value as string)
          .setTitle('Message Sent')
          .setTimestamp(interaction.createdTimestamp)
        ]
      })
    } catch {

    }
  },
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
};

const reportMessage: CommandDataWithHandler = {
  type: 'MESSAGE',
  name: 'Report To Mods',
  guildValidate: guild => guild.id === SERVER_ID,
  async handler(client, interaction) {
    if (!interaction.isContextMenu()) {
      return;
    }

    if (interaction.targetType !== 'MESSAGE') {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const reportedMsg = await interaction.channel.messages.fetch(
      interaction.targetId
    );
    const messages = await interaction.channel.messages.fetch({
      before: reportedMsg.id,
      limit: 25,
    });

    const member = await interaction.guild.members.fetch(
      interaction.member.user.id
    );

    await interaction.editReply({
      content: "Is this the message you'd like to report to mods",
      embeds: [
        new MessageEmbed()
          .setTitle('Report Details')
          .setDescription('Transcript of last 10 messages')
          .setURL(reportedMsg.url)
          .addFields(
            [reportedMsg, ...messages.values()]
              .reverse()
              .filter(message => !message.author.bot)
              .slice(-10)
              .map(message => {
                const attachment =
                  message.attachments.size > 0
                    ? `[${message.attachments.size} Attachment(s) ${message.url}] `
                    : '';
                return {
                  name: `${
                    message.author.id === reportedMsg.author.id ? '⚠️ ' : ''
                  }${message.author.username}#${
                    message.author.discriminator
                  } (${message.author.id}) @ <t:${Math.floor(
                    message.createdTimestamp / 1000
                  )}>`,
                  value: `${attachment}${message.content}`,
                };
              })
          ),
      ],
    });

    const thread = await createModMailThread(
      interaction.guild,
      interaction.user
    );

    const initialMsg = await thread.send({
      content: `<@&${MOD_ROLE_ID}>`,
      embeds: [
        createInitialEmbed(),
        createReporterEmbed(member),
        createReporteeEmbed(reportedMsg.member),
        new MessageEmbed()
          .setTitle('Report Details')
          .setDescription('Transcript of last 10 messages')
          .setURL(reportedMsg.url)
          .addFields(
            [reportedMsg, ...messages.values()]
              .reverse()
              .filter(message => !message.author.bot)
              .slice(-10)
              .map(message => {
                return {
                  name: `${
                    message.author.id === reportedMsg.author.id ? '⚠️ ' : ''
                  }${message.author.username}#${
                    message.author.discriminator
                  } (${message.author.id}) @ <t:${Math.floor(
                    message.createdTimestamp / 1000
                  )}>`,
                  value: `${message.content}`,
                };
              })
          ),
      ],
    });

    await initialMsg.pin();
  },
};

const reportUser: CommandDataWithHandler = {
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

export const commands = [sendCommand, reportMessage, reportUser];

function createInitialEmbed() {
  return new MessageEmbed().setTitle('New Ticket')
    .setDescription(`You can use type in this thread without messages being sent into the user. Please use this thread to also paste any evidence that relates to the case.

To send a message to the user please use the \`/send\` command.`);
}

function rolesList(roles: GuildMemberRoleManager | string[]) {
  if (Array.isArray(roles)) {
    return roles.map(x => `<@&${x}>`).join(', ');
  }
  return roles.cache
    .filter(x => x.name !== '@everyone')
    .map(x => x)
    .join(', ');
}

function createUserFields(member: GuildMember): EmbedField[] {
  return [
    {
      name: 'Name',
      // toString has been overridden for users
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      value: `${member.user} (${member.user.id})`,
      inline: false,
    },
    {
      name: 'Registered',
      value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}>`,
      inline: true,
    },
    {
      name: 'Joined',
      value: `<t:${Math.floor(member.joinedTimestamp / 1000)}>`,
      inline: true,
    },
    {
      name: `Roles (${rolesCount(member.roles)})`,
      value: `${rolesList(member.roles)}`,
      inline: false,
    },
  ];
}

function createReporterEmbed(member: GuildMember) {
  return new MessageEmbed()
    .setTitle('Reporter')
    .setDescription('Below is information regarding the reporter')
    .setColor(0x50_a0_00)
    .setAuthor({
      name: `${member.user.username}#${member.user.discriminator}`,
      iconURL: member.user.avatarURL(),
    })
    .setThumbnail(member.user.avatarURL())
    .addFields(createUserFields(member));
}

function createReporteeEmbed(member: GuildMember) {
  return new MessageEmbed()
    .setTitle('Reportee')
    .setDescription(
      'Below is information regarding the user that has been reported'
    )
    .setAuthor({
      name: `${member.user.username}#${member.user.discriminator}`,
      iconURL: member.user.avatarURL(),
    })
    .setThumbnail(member.user.avatarURL())
    .setColor(0xff_96_00)
    .addFields(createUserFields(member));
}

function rolesCount(roles: GuildMemberRoleManager | string[]) {
  return Array.isArray(roles)
    ? roles.filter(item => item !== '@everyone').length
    : roles.cache.filter(role => role.name !== '@everyone').size;
}
