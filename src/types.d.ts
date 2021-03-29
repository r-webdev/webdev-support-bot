/* eslint-disable @typescript-eslint/consistent-type-definitions */

declare module 'discord.js' {
  import type {
    ApplicationCommand,
    InteractionApplicationCommandCallbackData,
    InteractionResponse,
    MessageEmbed,
    MessageMentionOptions,
    MessageMentionOptions,
    MessageMentionOptions,
  } from 'discord.js';
  import { EventEmitter } from 'events';

  import type { ApplicationCommandOptionType } from './enums';
  import type { InteractionResponseType } from './enums';

  export interface Client {
    public api: BaseClient;
  }

  export interface BaseClient {
    applications: ApplicationRoutes;
    interactions: InteractionRoutes;
    webhooks: WebhookRoutes;
  }

  export interface WebSocketManager {
    public on(
      event: 'INTERACTION_CREATE',
      listener: (interaction: InteractionObject) => void
    ): this;
  }

  export type InteractionObject = {
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
    resolved: unknown;
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

  export type InteractionApplicationCommandCallbackData = {
    tts?: boolean;
    content: string;
    embeds?: MessageEmbed[];
    allowedMentions?: MessageMentionOptions;
    /**
     * set to 64 to make message ephemeral
     */
    flags?: 64;
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
    // default?: boolean;
    required?: boolean;
    choices?: ApplicationCommandOptionChoice[];
    options?: ApplicationCommandOption[];
  };

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

type CreateInteractionData = {
  content: string;
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  file?: unknown;
  embeds?: DiscordEmbed[];
  payload_json?: string;
  allowed_mentions?: MessageMentionOptions;
};

type WebhookRoutes = (
  applicationId: string,
  interactionToken: string
) => {
  // TODO: Swap anys out
  post(data: PostData<CreateInteractionData>): Promise<any>;

  messages(
    id: '@original'
  ): {
    patch(
      data: Omit<InteractionApplicationCommandCallbackData, 'tts' | 'flags'>
    ): Promise<Buffer>;
    delete(): Promise<Buffer>;
  };
  messages(
    id: string
  ): {
    patch(
      data: PostData<
        Omit<InteractionApplicationCommandCallbackData, 'tts' | 'flags'>
      >
    ): Promise<Buffer>;
    delete(): Promise<Buffer>;
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
