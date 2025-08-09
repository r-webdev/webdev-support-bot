import {
  ApplicationCommandOptionType,
  ChannelType,
  EmbedBuilder,
  GuildChannel,
  PermissionFlagsBits,
  TextBasedChannel,
  User,
  type Client,
  type CommandInteraction,
  type GuildMember,
  type TextChannel,
} from 'discord.js';
import type { CommandDataWithHandler } from '../../../types';
import {
  REPEL_DEFAULT_DELETE_COUNT,
  REPEL_ROLE_ID,
  REPEL_LOG_CHANNEL_ID,
  REPEL_DEFAULT_TIMEOUT,
} from '../../env';
import { DiscordAPIErrorCode } from '../../../enums';
import { logEmbed, logSimple } from '../../utils/channel-logger';

enum RepelCommandOptions {
  TARGET = 'target',
  MESSAGE_LINK = 'message_link',
  DELETE_COUNT = 'delete_count',
  TIMEOUT = 'timeout',
  REASON = 'reason',
}
const DAY = 24 * 60 * 60 * 1000;

const reply = (
  interaction: CommandInteraction,
  content: string,
  ephemeral = true,
) => interaction.reply({ content, ephemeral });

export const repelInteraction: CommandDataWithHandler = {
  name: 'repel',
  description: 'Remove recent messages and timeout a user',
  options: [
    {
      name: RepelCommandOptions.TARGET,
      description: 'The user to repel',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: RepelCommandOptions.REASON,
      description: 'Reason for repelling the user',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: RepelCommandOptions.DELETE_COUNT,
      description: `Number of messages to delete from the user (default: ${REPEL_DEFAULT_DELETE_COUNT})`,
      type: ApplicationCommandOptionType.Integer,
      required: false,
      choices: [
        {
          name: '5 messages',
          value: 5,
        },
        {
          name: '10 messages',
          value: 10,
        },
        {
          name: '20 messages',
          value: 20,
        },
        {
          name: '50 messages',
          value: 50,
        },
        {
          name: '100 messages',
          value: 100,
        },
        {
          name: '200 messages',
          value: 200,
        },
      ],
    },
    {
      name: RepelCommandOptions.TIMEOUT,
      description: `Timeout duration in hours (default: ${REPEL_DEFAULT_TIMEOUT} hours)`,
      type: ApplicationCommandOptionType.Integer,
      required: false,
      choices: [
        {
          name: 'No timeout',
          value: 0,
        },
        {
          name: '1 hour',
          value: 1,
        },
        {
          name: '2 hours',
          value: 2,
        },
        {
          name: '3 hours',
          value: 3,
        },
        {
          name: '6 hours',
          value: 6,
        },
        {
          name: '12 hours',
          value: 12,
        },
        {
          name: '1 day',
          value: 24,
        },
      ],
    },
  ],

  handler: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.inGuild() || !interaction.guild) {
      await reply(interaction, 'This command can only be used in a server.');
    }
    if (!interaction.isChatInputCommand()) {
      await reply(
        interaction,
        'This command can only be used as a slash command.',
      );
      return;
    }
    const repelRole = interaction.guild.roles.cache.find(
      role => role.id === REPEL_ROLE_ID,
    );

    if (!repelRole) {
      await reply(
        interaction,
        'Repel role not found. Please check the id in the environment variables.',
      );
      return;
    }
    const roleName = repelRole.name;
    const member = interaction.member as GuildMember;

    const canUseCommand =
      member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      member.roles.cache.has(repelRole.id) ||
      member.roles.cache.some(role => role.position >= repelRole.position);

    if (!canUseCommand) {
      await reply(
        interaction,
        `You do not have permission to use this command`,
      );
      return;
    }

    const targetUser = interaction.options.get(
      RepelCommandOptions.TARGET,
      false,
    )?.user as User;
    console.log('Target User:', targetUser);

    let targetGuildMember: GuildMember | null = null;
    let userNotInServer = false;

    try {
      targetGuildMember = await interaction.guild.members.fetch(targetUser.id);
    } catch (error: any) {
      if (
        error.code === DiscordAPIErrorCode.UnknownMember ||
        error.code === DiscordAPIErrorCode.UnknownUser
      ) {
        userNotInServer = true;
      } else {
        throw error;
      }
    }

    if (targetGuildMember !== null) {
      if (targetGuildMember.id === member.id) {
        await reply(interaction, 'You cannot repel yourself.');
        return;
      }

      if (targetGuildMember.roles.cache.has(repelRole.id)) {
        await reply(
          interaction,
          `You cannot repel a user with the ${roleName} role.`,
        );
        return;
      }

      const botMember = await interaction.guild.members.fetch(client.user!.id);
      const isOwner = interaction.guild.ownerId === member.id;

      if (targetGuildMember.id === interaction.guild.ownerId) {
        await reply(interaction, 'Cannot moderate the server owner.');
      }

      if (
        !isOwner &&
        targetGuildMember.roles.highest.position >=
          member.roles.highest.position
      ) {
        await reply(
          interaction,
          'You cannot moderate this user due to role hierarchy.',
        );
      }

      if (
        targetGuildMember.roles.highest.position >=
        botMember.roles.highest.position
      ) {
        await reply(
          interaction,
          'I cannot moderate this user due to role hierarchy.',
        );
      }
    }

    const targetId = userNotInServer ? targetUser.id : targetGuildMember!.id;
    const targetTag = userNotInServer
      ? targetUser.tag
      : targetGuildMember!.user.tag;

    try {
      await interaction.deferReply({ ephemeral: true });
      const messagesToDelete =
        interaction.options.getInteger(
          RepelCommandOptions.DELETE_COUNT,
          false,
        ) ?? REPEL_DEFAULT_DELETE_COUNT;
      let deletedCount = 0;
      const textChannels = interaction.guild.channels.cache
        .filter(
          (ch): ch is TextChannel =>
            (ch.type === ChannelType.GuildText ||
              ch.type === ChannelType.GuildVoice) &&
            ch.id !== interaction.channelId &&
            Boolean(ch.lastMessageId),
        )
        .sort((a, b) => {
          const aLastMessage = a.lastMessageId ? BigInt(a.lastMessageId) : 0n;
          const bLastMessage = b.lastMessageId ? BigInt(b.lastMessageId) : 0n;
          return Number(bLastMessage - aLastMessage);
        })
        .first(50);

      for (const channel of [interaction.channel, ...textChannels]) {
        if (deletedCount >= messagesToDelete) break;

        try {
          const messages = await channel.messages.fetch({
            limit: 100,
          });
          const userMessages = messages
            .filter(
              m =>
                m.author.id === targetId &&
                Date.now() - m.createdTimestamp < 14 * DAY,
            )
            .first(Math.min(messagesToDelete - deletedCount, messagesToDelete));
          if (userMessages.length > 0) {
            userMessages.length === 1
              ? await userMessages[0].delete()
              : await (channel as TextChannel).bulkDelete(userMessages);
            deletedCount += userMessages.length;
          }
        } catch {}
      }

      const isUserTimedOut =
        targetGuildMember?.communicationDisabledUntilTimestamp
          ? targetGuildMember.communicationDisabledUntilTimestamp > Date.now()
          : false;

      const timeoutDurationInHours =
        interaction.options.getInteger(RepelCommandOptions.TIMEOUT, false) ??
        REPEL_DEFAULT_TIMEOUT;
      if (
        !isUserTimedOut &&
        timeoutDurationInHours > 0 &&
        targetGuildMember !== null
      ) {
        await targetGuildMember.timeout(
          timeoutDurationInHours * 60 * 60 * 1000,
          `Repel command used by ${member.user.tag}`,
        );
        await interaction.editReply({
          content: `Successfully repelled ${targetTag}. Removed ${deletedCount} messages and timed out for ${timeoutDurationInHours} hours.`,
        });
      } else {
        await interaction.editReply({
          content: `Successfully repelled ${targetTag}. Removed ${deletedCount} messages.`,
        });
      }

      const channelInfo =
        interaction.channel?.type === ChannelType.GuildVoice
          ? `**${interaction.channel.name}** voice chat`
          : `<#${interaction.channelId}>`;

      const embed = new EmbedBuilder()
        .setTitle('Repel Action')
        .setDescription(
          `<@${targetId}> has been repelled by <@${member.id}> in ${channelInfo}.`,
        )
        .addFields(
          {
            name: 'Reason',
            value: interaction.options.getString(
              RepelCommandOptions.REASON,
              true,
            ),
          },
          {
            name: 'Deleted Messages',
            value: deletedCount.toString(),
          },
          {
            name: 'Timeout Duration',
            value:
              isUserTimedOut || userNotInServer
                ? 'No Timeout'
                : timeoutDurationInHours === 0
                  ? 'No Timeout'
                  : `${timeoutDurationInHours} hours`,
          },
        )
        .setColor(0x00ff00)
        .setTimestamp();
      await logEmbed(client, REPEL_LOG_CHANNEL_ID, embed, undefined, true);
    } catch (error: any) {
      const errorMsg =
        error.message || 'An error occurred while executing this command.';

      if (interaction.deferred) {
        await interaction.editReply({ content: errorMsg });
      } else {
        await reply(interaction, errorMsg + ' Please try again later.');
      }
    }
  },
};
