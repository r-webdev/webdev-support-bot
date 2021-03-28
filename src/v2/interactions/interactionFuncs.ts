/* eslint-disable no-await-in-loop */
/* eslint-disable no-void */
import type { InteractionObject } from 'discord.js';
import type {
  ApplicationCommand,
  Client,
  InteractionResponse,
  TextChannel,
} from 'discord.js';

import { InteractionType } from '../../enums';
import { chunkUntil } from '../utils/chunkUntil';
import { intersection } from '../utils/sets';
import { Interaction } from './interaction';

export type CommandData = {
  name: string;
  description: string;
  options?: ApplicationCommand['options'];
  handler: (client: Client, interaction: Interaction) => Promise<void> | void;
};

const commands = new Map<string, CommandData>();

export function createHandleInteractionWebhook(client: Client) {
  return function handleInteractionWebhook(
    interactionObj: InteractionObject
  ): void {
    if (
      interactionObj.type === InteractionType.APPLICATION_COMMAND &&
      interactionObj.data
    ) {
      const command = commands.get(interactionObj.data.name.toLowerCase());
      if (command) {
        const textChannel = getTextChannelFromMessageObj(
          client,
          interactionObj
        );
        const interaction = new Interaction(
          client,
          interactionObj,
          textChannel
        );
        return void command.handler(client, interaction);
      }
    }
  };
}

function getTextChannelFromMessageObj(
  client: Client,
  interactionObj: InteractionObject
): TextChannel {
  const guild = client.guilds.cache.get(interactionObj.guild_id);
  return guild.channels.cache.get(interactionObj.channel_id) as TextChannel;
}

export function registerCommand(commandData: CommandData): void {
  commands.set(commandData.name.toLowerCase(), commandData);
}

export function getRegisteredCommands(): Map<string, CommandData> {
  return new Map(commands);
}

export function registerGuildCommand(
  client: Client,
  guild: string,
  commandData: CommandData
): Promise<ApplicationCommand> {
  return createCommand(client, guild, {
    data: {
      description: commandData.description,
      name: commandData.name,
      options: commandData.options,
    },
  });
}

export async function getCommands(
  client: Client,
  guild: string
): Promise<ApplicationCommand[]> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands.get() as Promise<ApplicationCommand[]>;
}

export async function createCommand(
  client: Client,
  guild: string,
  data: PostData<ApplicationCommand>
): Promise<ApplicationCommand> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands.post(data);
}
export async function editCommand(
  client: Client,
  guild: string,
  commandId: string,
  data: PostData<ApplicationCommand>
): Promise<ApplicationCommand> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands(commandId)
    .patch(data);
}

export async function deleteCommand(
  client: Client,
  guild: string,
  commandId: string
): Promise<ApplicationCommand> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands(commandId)
    .delete();
}

export async function editOriginalInteractionResponse(
  client: Client,
  interaction: InteractionObject,
  response: PostData<any>
): Promise<unknown> {
  return client.api
    .webhooks(client.user.id, interaction.token)
    .messages('@original')
    .patch(response);
}

export async function deleteOriginalInteractionResponse(
  client: Client,
  interaction: InteractionObject
): Promise<unknown> {
  return client.api
    .webhooks(client.user.id, interaction.token)
    .messages('@original')
    .delete();
}

export async function createFollowupMessage(
  client: Client,
  interaction: InteractionObject,
  response: PostData<any>
): Promise<unknown> {
  return client.api.webhooks(client.user.id, interaction.token).post(response);
}

export async function editFollwupMessage(
  client: Client,
  interaction: InteractionObject,
  messageId: string,
  response: PostData<any>
): Promise<unknown> {
  return client.api
    .webhooks(client.user.id, interaction.token)
    .messages(messageId)
    .patch(response);
}

export async function deleteFollwupMessage(
  client: Client,
  interaction: InteractionObject,
  messageId: string,
  response: PostData<any>
): Promise<unknown> {
  return client.api
    .webhooks(client.user.id, interaction.token)
    .messages(messageId)
    .delete();
}

async function _createInteractionResponse(
  client: Client,
  guild: string,
  interaction: InteractionObject,
  response: PostData<InteractionResponse>
): Promise<unknown> {
  return client.api
    .interactions(interaction.id, interaction.token)
    .callback.post(response);
}

const chunkUntilOver2k = chunkUntil<string>(
  (current, next) => [...current, next].join('\n').length > 2000
);

export async function createInteractionResponse(
  client: Client,
  interaction: InteractionObject,
  response: PostData<InteractionResponse>
): Promise<unknown> {
  const { content } = response?.data?.data ?? {};
  const guildId = interaction.guild_id;
  if (content?.length <= 2000 || !content?.length) {
    return _createInteractionResponse(client, guildId, interaction, response);
  }
  let first = true;
  const guild = await client.guilds.fetch(guildId);
  const channel = guild.channels.resolve(interaction.channel_id) as TextChannel;

  try {
    channel.startTyping();
    for (const chunk of chunkUntilOver2k(content.split('\n'))) {
      const data = {
        ...response.data.data,
        content: chunk.join('\n'),
      };

      if (first) {
        await _createInteractionResponse(client, guildId, interaction, {
          ...response,
          data: {
            ...response.data,
            data,
          },
        });

        first = false;
      } else {
        await channel.send(chunk.join('\n'));
      }
    }
  } catch {}
  channel.stopTyping();
}
