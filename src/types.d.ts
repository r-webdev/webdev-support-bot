/* eslint-disable @typescript-eslint/consistent-type-definitions */

declare module 'discord.js' {
  import type {
    ApplicationCommand,
    InteractionResponse,
    MessageEmbed,
    MessageMentionOptions,
    MessageMentionOptions,
  } from 'discord.js';
  import { EventEmitter } from 'events';

  export interface Client {
    public api: BaseClient;
  }

  export interface BaseClient {
    applications: ApplicationRoutes;
    interactions: InteractionRoutes;
  }

  export interface WebSocketManager {
    public on(
      event: 'INTERACTION_CREATE',
      listener: (interaction: Interaction) => void
    ): this;
  }

  export enum InteractionType {
    PING = 1,
    APPLICATION_COMMAND = 2,
  }

  export type Interaction = {
    id: string;
    type: InteractionType;
    token: string;
    guild_id: string;
    channel_id: string;
    version: number;
    member: {
      user: {
        id: string;
        username: string;
        avatar: string;
        discriminator: string;
        public_flags: number;
      };
      roles: string[];
      premium_since: string | null;
      permissions: string;
      pending: boolean;
      nick: string | null;
      mute: boolean;
      joined_at: string;
      is_pending: boolean;
      deaf: false;
    };
    data?: ApplicationCommandInteractionData;
  };

  export type ApplicationCommandInteractionData = {
    id: string;
    name: string;
    options: ApplicationCommandInteractionDataOption[];
  };

  export type ApplicationCommandInteractionDataOption = {
    name: string;
    value?: string;
    options?: ApplicationCommandInteractionDataOption;
  };

  export type InteractionResponse = {
    type: InteractionResponseType;
    data?: InteractionApplicationCommandCallbackData;
  };

  export enum InteractionResponseType {
    PONG = 1,
    ACKNOWLEDGE = 2,
    CHANNEL_MESSAGE = 3,
    CHANNEL_MESSAGE_WITH_SOURCE = 4,
    ACKNOWLEDGE_WITH_SOURCE = 5,
  }

  export type InteractionApplicationCommandCallbackData = {
    tts?: boolean;
    content: string;
    embeds?: MessageEmbed[];
    allowedMentions?: MessageMentionOptions;
  };

  export type ApplicationCommand = {
    id: string;
    application_id: string;
    name: string;
    description: string;
    options?: ApplicationCommandOption[];
  };

  export type ApplicationCommandOption = {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    default?: boolean;
    required?: boolean;
    choices?: ApplicationCommandOptionChoice[];
    options?: ApplicationCommandOption[];
  };

  export enum ApplicationCommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
    BOOLEAN = 5,
    USER = 6,
    CHANNEL = 7,
    ROLE = 8,
  }

  export type ApplicationCommandOptionChoice = {
    name: string;
    value: string | number;
  };
}

type PostData<T> = {
  data: Omit<T, 'application_id' | 'id'>;
};

type ApplicationRoutes = (
  id: string
) => {
  guilds(
    id: string
  ): {
    commands: {
      get: () => Promise<ApplicationCommand[]>;
      post: (data: PostData<ApplicationCommand>) => Promise<ApplicationCommand>;
    } & ((
      id: string
    ) => {
      patch: (
        data: PostData<ApplicationCommand>
      ) => Promise<ApplicationCommand>;
      delete: () => Promise<ApplicationCommand>;
    });
  };
};

type InteractionRoutes = (
  id: string,
  token: string
) => {
  callback: {
    post(data: PostData<InteractionResponse>): Promise<unknown>;
  };
  ['@original']: {
    patch(data: PostData<InteractionResponse>): Promise<unknown>;
    delete(): Promise<unknown>;
  };
};

type RestShit<Input, Output> = {
  get(input?: Input): Promise<Output>;
  post(input: Input): Promise<Output>;
  patch(input: Input): Promise<Output>;
  put(input: Input): Promise<Output>;
  delete(input: Input): Promise<Output>;
};

declare namespace Intl {
  export class ListFormat {
    public constructor();

    public format(iter: Iterable<string>): string;
  }
}
