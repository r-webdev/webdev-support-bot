import {
  Client,
  TextChannel,
  EmbedBuilder,
  MessageCreateOptions,
  ChannelType,
} from 'discord.js';

// Types for different log content structures
export interface SimpleLogContent {
  type: 'simple';
  message: string;
}

export interface EmbedLogContent {
  type: 'embed';
  embed: EmbedBuilder | EmbedBuilder[];
  content?: string;
}

export interface CustomLogContent {
  type: 'custom';
  options: MessageCreateOptions;
}

export type LogContent = SimpleLogContent | EmbedLogContent | CustomLogContent;

export interface LoggerOptions {
  client: Client;
  channelId: string;
  content: LogContent;
  fallbackChannelId?: string;
  silent?: boolean;
}

/**
 * Get channel by ID with proper type checking
 */
async function getChannel(
  client: Client,
  channelId: string,
): Promise<TextChannel | null> {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      return null;
    }

    return channel as TextChannel;
  } catch {
    return null;
  }
}

/**
 * Send message based on content type
 */
async function sendMessage(
  channel: TextChannel,
  content: LogContent,
): Promise<boolean> {
  try {
    let messageOptions: MessageCreateOptions;

    switch (content.type) {
      case 'simple':
        messageOptions = { content: content.message };
        break;

      case 'embed':
        messageOptions = {
          embeds: Array.isArray(content.embed)
            ? content.embed
            : [content.embed],
          content: content.content || undefined,
        };
        break;

      case 'custom':
        messageOptions = content.options;
        break;

      default:
        throw new Error('Invalid content type provided');
    }

    await channel.send(messageOptions);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

/**
 * Main logging function - sends a message to the specified channel
 */
export async function logToChannel(options: LoggerOptions): Promise<boolean> {
  try {
    const channel = await getChannel(options.client, options.channelId);

    if (!channel) {
      // Try fallback channel if provided
      if (options.fallbackChannelId) {
        const fallbackChannel = await getChannel(
          options.client,
          options.fallbackChannelId,
        );
        if (fallbackChannel) {
          return await sendMessage(fallbackChannel, options.content);
        }
      }

      if (!options.silent) {
        throw new Error(
          `Channel with ID ${options.channelId} not found or not accessible`,
        );
      }
      return false;
    }

    return await sendMessage(channel, options.content);
  } catch (error) {
    if (!options.silent) {
      console.error('Channel Logger Error:', error);
      throw error;
    }
    return false;
  }
}

/**
 * Quick function for simple text logging
 */
export async function logSimple(
  client: Client,
  channelId: string,
  message: string,
  silent: boolean = false,
): Promise<boolean> {
  return logToChannel({
    client,
    channelId,
    content: { type: 'simple', message },
    silent,
  });
}

/**
 * Quick function for embed logging
 */
export async function logEmbed(
  client: Client,
  channelId: string,
  embed: EmbedBuilder | EmbedBuilder[],
  content?: string,
  silent: boolean = false,
): Promise<boolean> {
  return logToChannel({
    client,
    channelId,
    content: { type: 'embed', embed, content },
    silent,
  });
}

/**
 * Quick function for custom message logging
 */
export async function logCustom(
  client: Client,
  channelId: string,
  options: MessageCreateOptions,
  fallbackChannelId?: string,
  silent: boolean = false,
): Promise<boolean> {
  return logToChannel({
    client,
    channelId,
    content: { type: 'custom', options },
    fallbackChannelId,
    silent,
  });
}

// Template functions for common log scenarios

/**
 * Create a moderation action embed
 */
export function createModerationEmbed(options: {
  action: string;
  moderator: string;
  target: string;
  reason?: string;
  duration?: string;
  color?: number;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🔨 ${options.action}`)
    .setColor(options.color || 0xff6b6b)
    .addFields(
      { name: 'Moderator', value: options.moderator, inline: true },
      { name: 'Target', value: options.target, inline: true },
    )
    .setTimestamp();

  if (options.reason) {
    embed.addFields({ name: 'Reason', value: options.reason, inline: false });
  }

  if (options.duration) {
    embed.addFields({
      name: 'Duration',
      value: options.duration,
      inline: true,
    });
  }

  return embed;
}

/**
 * Create a user join/leave embed
 */
export function createUserEventEmbed(options: {
  type: 'join' | 'leave';
  user: string;
  memberCount?: number;
  color?: number;
}): EmbedBuilder {
  const isJoin = options.type === 'join';
  const embed = new EmbedBuilder()
    .setTitle(`${isJoin ? '📥' : '📤'} User ${isJoin ? 'Joined' : 'Left'}`)
    .setColor(options.color || (isJoin ? 0x57f287 : 0xfaa61a))
    .addFields({ name: 'User', value: options.user, inline: true })
    .setTimestamp();

  if (options.memberCount) {
    embed.addFields({
      name: 'Member Count',
      value: options.memberCount.toString(),
      inline: true,
    });
  }

  return embed;
}

/**
 * Create a message deletion embed
 */
export function createMessageDeletedEmbed(options: {
  author: string;
  channel: string;
  content?: string;
  attachments?: number;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message Deleted')
    .setColor(0xed4245)
    .addFields(
      { name: 'Author', value: options.author, inline: true },
      { name: 'Channel', value: options.channel, inline: true },
    )
    .setTimestamp();

  if (options.content) {
    embed.addFields({
      name: 'Content',
      value:
        options.content.length > 1024
          ? options.content.substring(0, 1021) + '...'
          : options.content,
      inline: false,
    });
  }

  if (options.attachments && options.attachments > 0) {
    embed.addFields({
      name: 'Attachments',
      value: options.attachments.toString(),
      inline: true,
    });
  }

  return embed;
}

/**
 * Convenience function: Log a moderation action
 */
export async function logModerationAction(
  client: Client,
  channelId: string,
  options: {
    action: string;
    moderator: string;
    target: string;
    reason?: string;
    duration?: string;
    color?: number;
  },
  silent: boolean = false,
): Promise<boolean> {
  const embed = createModerationEmbed(options);
  return logEmbed(client, channelId, embed, undefined, silent);
}

/**
 * Convenience function: Log a user join/leave event
 */
export async function logUserEvent(
  client: Client,
  channelId: string,
  options: {
    type: 'join' | 'leave';
    user: string;
    memberCount?: number;
    color?: number;
  },
  silent: boolean = false,
): Promise<boolean> {
  const embed = createUserEventEmbed(options);
  return logEmbed(client, channelId, embed, undefined, silent);
}

/**
 * Convenience function: Log a message deletion
 */
export async function logMessageDeleted(
  client: Client,
  channelId: string,
  options: {
    author: string;
    channel: string;
    content?: string;
    attachments?: number;
  },
  silent: boolean = false,
): Promise<boolean> {
  const embed = createMessageDeletedEmbed(options);
  return logEmbed(client, channelId, embed, undefined, silent);
}

// Example usage patterns:
/*
import { 
  logSimple, 
  logEmbed, 
  logToChannel,
  logModerationAction,
  createModerationEmbed 
} from './utils/channel-logger';

// Simple text log
await logSimple(client, 'CHANNEL_ID', 'User performed an action');

// Embed log
const embed = new EmbedBuilder()
  .setTitle('Test Log')
  .setDescription('This is a test')
  .setColor(0x00ff00);

await logEmbed(client, 'CHANNEL_ID', embed);

// Moderation action (using convenience function)
await logModerationAction(client, 'MOD_LOG_CHANNEL', {
  action: 'Ban',
  moderator: `<@${interaction.user.id}>`,
  target: `<@${targetUser.id}>`,
  reason: 'Spam',
  color: 0xff0000
});

// Custom complex message
await logToChannel({
  client,
  channelId: 'ADMIN_CHANNEL',
  content: {
    type: 'custom',
    options: {
      content: `<@&MODERATOR_ROLE> Attention needed!`,
      embeds: [embed1, embed2],
      allowedMentions: { roles: ['MODERATOR_ROLE'] }
    }
  },
  fallbackChannelId: 'BACKUP_CHANNEL',
  silent: true
});
*/
