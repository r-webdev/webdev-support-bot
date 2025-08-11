import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Role,
  User,
  type Client,
  type CommandInteraction,
  type TextChannel,
} from 'discord.js';
import type { CommandDataWithHandler } from '../../../types';
import {
  REPEL_DEFAULT_DELETE_COUNT,
  REPEL_ROLE_ID,
  REPEL_LOG_CHANNEL_ID,
  REPEL_DEFAULT_TIMEOUT,
  MODERATORS_ROLE_IDS,
} from '../../env';
import { DiscordAPIErrorCode } from '../../../enums';
import { logEmbed } from '../../utils/channel-logger';
import { buildCommandString } from '../../utils/build-command-string';

enum RepelCommandOptions {
  TARGET = 'target',
  MESSAGE_LINK = 'message_link',
  DELETE_COUNT = 'delete_count',
  TIMEOUT = 'timeout',
  REASON = 'reason',
  MESSAGE_TO_MODS = 'message_for_moderators',
}

const MESSAGES_PER_CHANNEL = 100; // Max messages to fetch per channel
const DAYS_LOOK_BACK = 4; /* Number of days to look back for messages */
const DAY = 24 * 60 * 60 * 1000;
const IGNORED_CHANNEL_CATEGORIES = [
  '679621550118273043' /* Staff */,
  '973896398087000084' /* Mod Related Logs */,
  '1350420544142442559' /* Tickets */,
  '837507969859977258' /* Archived */,
];

const reply = (
  interaction: CommandInteraction,
  content: string,
  ephemeral = true,
) => interaction.reply({ content, ephemeral });

const isUserInServer = (target: User | GuildMember): target is GuildMember => {
  return target instanceof GuildMember;
};

const isUserTimedOut = (target: GuildMember) => {
  return target.communicationDisabledUntilTimestamp
    ? target.communicationDisabledUntilTimestamp > Date.now()
    : false;
};

const handleTimeout = async ({
  target,
  duration,
}: {
  target: User | GuildMember;
  duration: number;
}) => {
  if (!isUserInServer(target) || isUserTimedOut(target)) return 0;
  const timeoutDuration = duration * 60 * 60 * 1000;
  await target.timeout(
    timeoutDuration,
    `Repel command used by ${target.user.tag}`,
  );
  return duration;
};

const getTargetFromInteraction = async (
  interaction: ChatInputCommandInteraction,
) => {
  const targetUser = interaction.options.getUser(
    RepelCommandOptions.TARGET,
    true,
  );
  let target: User | GuildMember | null = null;
  try {
    target = await interaction.guild!.members.fetch(targetUser.id);
  } catch (error: any) {
    if (
      error.code === DiscordAPIErrorCode.UnknownMember ||
      error.code === DiscordAPIErrorCode.UnknownUser
    ) {
      target = targetUser;
    } else {
      throw error;
    }
  }
  return target;
};

const getTextChannels = (interaction: ChatInputCommandInteraction) => {
  const channels = interaction.guild.channels.cache
    .filter(
      (ch): ch is TextChannel =>
        !IGNORED_CHANNEL_CATEGORIES.includes(ch.parentId) &&
        ch.type === ChannelType.GuildText &&
        Boolean(ch.lastMessageId),
    )
    .values();
  return [interaction.channel as TextChannel, ...channels];
};

const checkPermission = async ({
  interaction,
  member,
  repelRole,
}: {
  interaction: ChatInputCommandInteraction;
  member: GuildMember;
  repelRole: Role;
}) => {
  const hasPermission =
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.roles.cache.has(repelRole.id) ||
    member.roles.cache.some(role => role.position >= repelRole.position);

  if (!hasPermission) {
    await reply(interaction, `You do not have permission to use this command`);
    return false;
  }
  return true;
};

const checkCanUseCommandOnTarget = async ({
  interaction,
  client,
  member,
  target,
  repelRole,
}: {
  interaction: ChatInputCommandInteraction;
  client: Client;
  member: GuildMember;
  target: GuildMember | User;
  repelRole: Role;
}) => {
  const botMember = await interaction.guild.members.fetch(client.user!.id);
  if (!isUserInServer(target)) {
    return true;
  }

  const isTargetServerOwner = interaction.guild.ownerId === member.id;
  if (target.id === member.id) {
    await reply(interaction, 'You cannot repel yourself.');
    return false;
  }

  if (target.roles.cache.has(repelRole.id)) {
    await reply(
      interaction,
      `You cannot repel a user with the ${repelRole.name} role.`,
    );
    return false;
  }

  if (target.id === interaction.guild.ownerId) {
    await reply(interaction, 'Cannot moderate the server owner.');
    return false;
  }

  if (
    !isTargetServerOwner &&
    target.roles.highest.position >= member.roles.highest.position
  ) {
    await reply(
      interaction,
      'You cannot moderate this user due to role hierarchy.',
    );
    return false;
  }

  if (target.roles.highest.position >= botMember.roles.highest.position) {
    await reply(
      interaction,
      'I cannot moderate this user due to role hierarchy.',
    );
    return false;
  }
  return true;
};

const handleDeleteMessages = async ({
  channels,
  count,
  targetId,
}: {
  channels: ReturnType<typeof getTextChannels>;
  count: number;
  targetId: string;
}) => {
  let deletedCount = 0;
  for (const channel of channels) {
    if (deletedCount >= count) break;
    try {
      const messages = await channel.messages.fetch({
        limit: MESSAGES_PER_CHANNEL,
      });
      if (messages.size === 0) continue;
      const targetMessages = messages
        .filter(
          message =>
            message.author.id === targetId &&
            Date.now() - message.createdTimestamp < DAYS_LOOK_BACK * DAY,
        )
        .first(Math.min(count - deletedCount, count));
      if (targetMessages.length > 0) {
        if (targetMessages.length === 1) {
          await targetMessages[0].delete();
        } else {
          await channel.bulkDelete(targetMessages);
        }
        deletedCount += targetMessages.length;
      }
      return deletedCount;
    } catch {
      continue;
    }
  }
};

const logToChannel = async ({
  interaction,
  member,
  target,
  duration,
  deleteCount,
}: {
  interaction: ChatInputCommandInteraction;
  member: GuildMember;
  target: User | GuildMember;
  duration?: number;
  deleteCount: number;
}) => {
  const channelInfo =
    interaction.channel?.type === ChannelType.GuildVoice
      ? `**${interaction.channel.name}** voice chat`
      : `<#${interaction.channelId}>`;
  const memberAuthor = {
    name: member.user.tag,
    iconURL: member.user.displayAvatarURL(),
  };
  const targetAuthor = {
    name: isUserInServer(target)
      ? `${target.user.tag} | Repel | ${target.user.username}`
      : `${target.tag} | Repel | ${target.username}`,
    iconURL: isUserInServer(target)
      ? target.user.displayAvatarURL()
      : target.displayAvatarURL(),
  };

  const commandEmbed = new EmbedBuilder()
    .setAuthor(memberAuthor)
    .setDescription(
      `Used \`repel\` command in ${channelInfo}.\n` +
        buildCommandString(interaction),
    )
    .setColor('Green')
    .setTimestamp();
  const resultEmbed = new EmbedBuilder()
    .setAuthor(targetAuthor)
    .addFields(
      {
        name: 'Target',
        value: `<@${target.id}>`,
        inline: true,
      },
      {
        name: 'Moderator',
        value: `<@${member.id}>`,
        inline: true,
      },
      {
        name: 'Reason',
        value: interaction.options.getString(RepelCommandOptions.REASON, true),
        inline: true,
      },
      {
        name: 'Deleted Messages',
        value: deleteCount.toString(),
        inline: true,
      },
      {
        name: 'Timeout Duration',
        value: duration ? `${duration} hours` : 'No Timeout',
        inline: true,
      },
    )
    .setColor('Orange')
    .setTimestamp();

  const modMessage =
    interaction.options.getString(RepelCommandOptions.MESSAGE_TO_MODS) ?? false;
  const mentionText = modMessage
    ? `${MODERATORS_ROLE_IDS.map(id => `<@&${id}>`)} - ${modMessage}`
    : undefined;
  await logEmbed(
    interaction.client,
    REPEL_LOG_CHANNEL_ID,
    [commandEmbed, resultEmbed],
    mentionText,
    true,
  );
};

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
    {
      name: RepelCommandOptions.MESSAGE_TO_MODS,
      description: 'Pings moderators with a message',
      type: ApplicationCommandOptionType.String,
      required: false,
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

    const member = interaction.member as GuildMember;
    const hasPermission = await checkPermission({
      interaction,
      member,
      repelRole,
    });
    if (!hasPermission) return;

    const target = await getTargetFromInteraction(interaction);
    const canUseCommandOnTarget = await checkCanUseCommandOnTarget({
      interaction,
      client,
      member,
      target,
      repelRole,
    });

    if (!canUseCommandOnTarget) return;

    await reply(
      interaction,
      `Repelled ${isUserInServer(target) ? target.user.tag : target.tag}.`,
      true,
    );

    try {
      const duration =
        interaction.options.getInteger(RepelCommandOptions.TIMEOUT, false) ??
        REPEL_DEFAULT_TIMEOUT;

      const timeout = await handleTimeout({
        target,
        duration,
      });

      const count =
        interaction.options.getInteger(
          RepelCommandOptions.DELETE_COUNT,
          false,
        ) ?? REPEL_DEFAULT_DELETE_COUNT;
      const channels = getTextChannels(interaction);
      const deleted = await handleDeleteMessages({
        channels,
        count,
        targetId: target.id,
      });

      await logToChannel({
        interaction,
        member,
        target,
        duration: timeout,
        deleteCount: deleted,
      });
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
