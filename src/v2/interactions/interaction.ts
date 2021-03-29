import { MessageEmbed, Base } from 'discord.js';
import type {
  InteractionObject,
  Client,
  TextChannel,
  ApplicationCommandInteractionData,
  APIMessageContentResolvable,
  InteractionApplicationCommandCallbackData,
  Message,
} from 'discord.js';

import type { InteractionType } from '../../enums';
import { InteractionResponseType } from '../../enums';
import { castArray } from '../utils/castArray';
import {
  createFollowupMessage,
  createInteractionResponse,
  editOriginalInteractionResponse,
} from './interactionFuncs';

export class Interaction extends Base implements InteractionObject {
  public channel: TextChannel;

  public id: string;

  public type: InteractionType;

  public channel_id: string;

  public data: ApplicationCommandInteractionData;

  public guild_id: string;

  public version: number;

  public token: string;

  public member: {
    user: {
      id: string;
      username: string;
      avatar: string;
      discriminator: string;
      public_flags: number;
    };
    roles: string[];
    premium_since: string;
    permissions: string;
    pending: boolean;
    nick: string;
    mute: boolean;
    joined_at: string;
    is_pending: boolean;
    deaf: false;
  };

  private _replied = false;

  private _ephemeralResponse?: boolean;

  public constructor(
    client: Client,
    data: InteractionObject,
    channel: TextChannel
  ) {
    super(client);

    Object.assign(this, data);
  }

  public async reply(
    data:
      | APIMessageContentResolvable
      | InteractionApplicationCommandCallbackData
  ): typeof data extends { flag: 64 } ? Promise<void> : Promise<Message> {
    const content: InteractionApplicationCommandCallbackData = normalizeContent(
      data
    );

    const isEphemeral = Boolean(content.flags & 64);

    if (this._replied) {
      const response = await createFollowupMessage(this.client, this, {
        data: content,
      });

      return getTextMessageFromMessageObj(
        this.client,
        this.guild_id,
        response as Record<string, string>
      );
    }

    this._replied = true;
    await createInteractionResponse(this.client, this, {
      data: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: content,
      },
    });

    if (isEphemeral) {
      this._ephemeralResponse = true;
      return;
    }

    const messageData = await editOriginalInteractionResponse(
      this.client,
      this,
      {
        data: {},
      }
    );

    return getTextMessageFromMessageObj(
      this.client,
      this.guild_id,
      messageData as Record<string, string>
    );
  }

  public async acknowledge(): Promise<Message | null> {
    if (this._replied) {
      return Promise.resolve(null);
    }

    this._replied = true;
    await createInteractionResponse(this.client, this, {
      data: {
        type: InteractionResponseType.ACKNOWLEDGE_WITH_SOURCE,
      },
    });
  }

  public async update(
    data:
      | APIMessageContentResolvable
      | InteractionApplicationCommandCallbackData
  ): Promise<Message> {
    const content = normalizeContent(data);
    const msgData = await editOriginalInteractionResponse(this.client, this, {
      data: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        ...content,
      },
    });

    return getTextMessageFromMessageObj(
      this.client,
      this.guild_id,
      msgData as Record<string, string>
    );
  }
}

function getTextMessageFromMessageObj(
  client: Client,
  guildId: string,
  messageObject: Record<string, string>
): Promise<Message> {
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(
    messageObject.channel_id
  ) as TextChannel;
  return channel.messages.fetch(messageObject.id);
}
function normalizeContent(
  data:
    | string
    | number
    | bigint
    | boolean
    | symbol
    | InteractionApplicationCommandCallbackData
    | readonly unknown[]
) {
  let content: InteractionApplicationCommandCallbackData;

  if (Object.prototype.toString.call(data) === '[object Object]') {
    content = {
      content: '',
      ...(data as InteractionApplicationCommandCallbackData),
    };
  } else if (
    data instanceof MessageEmbed ||
    (Array.isArray(data) && data.every(item => item instanceof MessageEmbed))
  ) {
    content = {
      content: '',
      embeds: castArray(data),
    };
  } else {
    content = { content: String(data) };
  }
  return content;
}
