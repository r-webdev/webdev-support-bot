/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Client } from 'discord.js';
import { Collection } from 'discord.js';
import _ from 'lodash';

// quick responses
// base commands
// meme commands

const guildCommands = new Collection([]); // placeholder for now

export const registerUserContextMenu = async (
  client: Client
): Promise<void> => {
  const existingCommands = await client.application.commands.fetch();
  existingCommands.sweep(x => x.type !== 'USER');

  client.application.commands.set([]);

  client.on('interactionCreate', interaction => {
    if (!interaction.isContextMenu() || interaction.targetType !== 'USER') {
      return;
    }
    console.log({ interaction });
  });
};
