
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Client } from 'discord.js';
import { Collection } from 'discord.js';
import _ from 'lodash';

// quick responses
// base commands
// meme commands

const guildCommands = new Collection([]); // placeholder for now

export const registerMessageContextMenu = async (client: Client): Promise<void> => {
  const existingCommands = await client.application.commands.fetch()
  existingCommands.sweep(x => x.type !== "MESSAGE")

  if(existingCommands.size === 0) {
    client.application.commands.create({
      name: "Mod: Warn",
      type: "MESSAGE",
    })
  } else {
    console.log("DONE!")
  }

  client.on("interactionCreate", interaction => {
    if(!interaction.isContextMenu() || interaction.targetType !== "MESSAGE") {return}
    console.log(interaction)
  })
}
