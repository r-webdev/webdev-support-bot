import {
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits,
  User,
  type Client,
  type CommandInteraction,
  type GuildMember,
  type TextChannel,
} from 'discord.js';
import type { CommandDataWithHandler } from '../../../types';
import { REPEL_DELETE_COUNT, REPEL_ROLE_NAME } from '../../env';

const TARGET_KEY = 'target';
const MESSAGE_LINK_KEY = 'message_link';
const DAY = 24 * 60 * 60 * 1000;
const TIMEOUT_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

const reply = (
  interaction: CommandInteraction,
  content: string,
  ephemeral = true,
) => interaction.reply({ content, ephemeral });

const getTargetFromMessage = async (
  client: Client,
  guild: any,
  messageLink: string,
) => {
  const match = messageLink.match(/(?:channels|@me)\/(?:(\d+)\/)?(\d+)\/(\d+)/);
  if (!match) throw new Error('Invalid message link format.');
  const messageId = match[3];
  const channelId = match[2];

  const channel = channelId ? await client.channels.fetch(channelId) : null;
  if (channel?.type !== ChannelType.GuildText)
    throw new Error('Invalid channel for message link.');

  const message = await (channel as TextChannel).messages.fetch(messageId);
  return await guild.members.fetch(message.author.id);
};

export const repelInteraction: CommandDataWithHandler = {
  name: 'repel',
  description:
    'Remove recent messages and timeout a user (requires timeout permissions)',
  options: [
    {
      name: TARGET_KEY,
      description: 'The user to repel',
      type: ApplicationCommandOptionType.User,
      required: false,
    },
    {
      name: MESSAGE_LINK_KEY,
      description: 'Message link to identify the user to repel',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  handler: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.inGuild() || !interaction.guild) {
      await reply(interaction, 'This command can only be used in a server.');
    }
    const repelRole = interaction.guild.roles.cache.find(
      role => role.name === REPEL_ROLE_NAME,
    );

    if (!repelRole) {
      await reply(
        interaction,
        `${REPEL_ROLE_NAME || 'Repel'} role not found. Please contact an admin.`,
      );
      return;
    }
    const member = interaction.member as GuildMember;

    const canUseCommand =
      member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
      member.roles.cache.has(repelRole.id) ||
      member.roles.cache.some(role => role.position >= repelRole.position);

    if (!canUseCommand) {
      await reply(
        interaction,
        `You do not have permission to use this command. You need the ${REPEL_ROLE_NAME} role or moderate members permission.`,
      );
      return;
    }

    const targetUser = interaction.options.get(TARGET_KEY, false)?.user as
      | User
      | undefined;
    const messageLink = interaction.options.get(MESSAGE_LINK_KEY, false)
      ?.value as string | undefined;

    if (!targetUser && !messageLink) {
      await reply(
        interaction,
        'You must specify either a user or a message link.',
      );
    }

    try {
      let targetMember: GuildMember;

      if (targetUser) {
        targetMember = await interaction.guild.members.fetch(targetUser.id);
      } else if (messageLink) {
        targetMember = await getTargetFromMessage(
          client,
          interaction.guild,
          messageLink!,
        );
      }

      if (targetMember.id === member.id) {
        await reply(interaction, 'You cannot repel yourself.');
        return;
      }

      const botMember = await interaction.guild.members.fetch(client.user!.id);
      const isOwner = interaction.guild.ownerId === member.id;

      if (targetMember.id === interaction.guild.ownerId) {
        await reply(interaction, 'Cannot moderate the server owner.');
      }

      if (
        !isOwner &&
        targetMember.roles.highest.position >= member.roles.highest.position
      ) {
        await reply(
          interaction,
          'You cannot moderate this user due to role hierarchy.',
        );
      }

      if (
        targetMember.roles.highest.position >= botMember.roles.highest.position
      ) {
        await reply(
          interaction,
          'I cannot moderate this user due to role hierarchy.',
        );
      }

      await interaction.deferReply({ ephemeral: true });

      let deletedCount = 0;
      const textChannels = interaction.guild.channels.cache.filter(
        ch => ch.type === ChannelType.GuildText,
      );

      for (const [, channel] of textChannels) {
        if (deletedCount >= REPEL_DELETE_COUNT) break;

        try {
          const messages = await channel.messages.fetch({
            limit: 100,
          });
          const userMessages = messages
            .filter(
              m =>
                m.author.id === targetMember.id &&
                Date.now() - m.createdTimestamp < 14 * DAY,
            )
            .first(
              Math.min(REPEL_DELETE_COUNT - deletedCount, REPEL_DELETE_COUNT),
            );
          if (userMessages.length > 0) {
            userMessages.length === 1
              ? await userMessages[0].delete()
              : await (channel as TextChannel).bulkDelete(userMessages);
            deletedCount += userMessages.length;
          }
        } catch {}
      }

      const isUserTimedOut = targetMember.communicationDisabledUntilTimestamp
        ? targetMember.communicationDisabledUntilTimestamp > Date.now()
        : false;

      if (!isUserTimedOut) {
        await targetMember.timeout(
          TIMEOUT_DURATION,
          `Repel command used by ${member.user.tag}`,
        );
        await interaction.editReply({
          content: `Successfully repelled ${targetMember.user.tag}. Removed ${deletedCount} messages and timed out for 6 hours.`,
        });
      } else {
        await interaction.editReply({
          content: `Successfully repelled ${targetMember.user.tag}. Removed ${deletedCount} messages.`,
        });
      }
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
