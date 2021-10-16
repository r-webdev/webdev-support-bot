/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ApplicationCommand, Client } from 'discord.js';
import { Collection } from 'discord.js';
import _ from 'lodash';

import { map } from '../utils/map';
import { merge } from '../utils/merge';
import { difference, intersection } from '../utils/sets';
// quick responses
// base commands
import { aboutInteraction } from './about';
import { leaderboardCommand } from './leaderboard';
import { mdnCommand } from './mdn';
import { npmInteraction } from './npm';
import { phpCommand } from './php';
import { pleaseInteraction } from './please';
import { pointsHandlers } from './points';
import { jobPostCommand } from './post';
import { resourceInteraction } from './resource';
// meme commands
import { shitpostInteraction } from './shitpost';


const getRelevantCmdProperties = ({description, name, options}: {description: string, name: string, options?: unknown[]}) => stripEmpty({
  description, name,options
})

const stripEmpty = (obj:Record<string,unknown>):Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([,b]) => b != null)
  )
}

const applicationCommands = new Collection(
  [
    aboutInteraction,
    mdnCommand,
    phpCommand,
    pleaseInteraction,
    pointsHandlers,
    jobPostCommand,
    leaderboardCommand,
    resourceInteraction,
    shitpostInteraction,
    npmInteraction,
  ].map(command => [command.name, command])
);

const createNewCommands = (client:Client, commandMap: Map<string, ApplicationCommand>) => map(async (name:string) => {
  const command = applicationCommands.get(name)
  // this is always true
  if(command) {
    const {onAttach, handler,...rest} = command
    console.info(`Creating ${name}`)

    return client.application.commands.create(rest)
  }
})

const guildCommands = new Collection([]); // placeholder for now

export const registerCommands = async (client: Client): Promise<void> => {
  client.on('interactionCreate', interaction => {
    if (!interaction.isCommand()) {
      return;
    }

    try {
      if (applicationCommands.has(interaction.commandName)) {
        applicationCommands
          .get(interaction.commandName)
          ?.handler(client, interaction);
      } else {
        interaction.reply({
          ephemeral: true,
          content: "Couldn't recognise command.",
        });
      }
    } catch {
      interaction.reply({
        ephemeral: true,
        content: 'Something went wrong when trying to execute the command',
      });
    }
  });

  for (const { onAttach } of applicationCommands.values()) {
    // We're attaching these so it's fine
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    onAttach?.(client)
  }

  const discordCommandsById = await client.application.commands.fetch()
  discordCommandsById.sweep(x => x.type !== "CHAT_INPUT")

  const discordCommands = new Collection(discordCommandsById.map((value) => [value.name, value]))



  const newCommands = difference(applicationCommands.keys(), (discordCommands.keys()))
  const existingCommands = intersection(applicationCommands.keys(), (discordCommands.keys()))
  const deletedCommands = difference<string>((discordCommands.keys()), applicationCommands.keys())
  // const new = await client.application.commands.create()
  await Promise.all(merge(
    createNewCommands(client, discordCommands)(newCommands),
    editExistingCommands(client, discordCommands)(existingCommands),
    deleteRemovedCommands(client,discordCommands)(deletedCommands),
  )
  )

  console.log("General Commands All Added")
  // await client.application?.commands.set([{type:''}])
  await client.guilds.cache.get('618935554171469834').commands.set([]);

  console.log("Guild specific commands added")
  // client.guilds.cache.forEach(guild => {
  //   guild.commands.set([])
  // })

};
function editExistingCommands(client: Client, existingCommands: Map<string, ApplicationCommand>) {
  return map((name:string) => {
    const cmd = applicationCommands.get(name)
    const existing = existingCommands.get(name)

    const { onAttach, handler, ...command} = cmd

    if(!_.isEqual(getRelevantCmdProperties(cmd),getRelevantCmdProperties(existing))) {
      console.info(`Updating ${name}`)
      console.log({ new : JSON.stringify(getRelevantCmdProperties(cmd), null, 2), old : JSON.stringify(getRelevantCmdProperties(existing), null, 2)})
      return client.application.commands.edit(existing.id, command)
    }
  })
}

function deleteRemovedCommands(client: Client, existingCommands: Map<string, ApplicationCommand>) {
  return map(async (name:string) => {
    const existing = existingCommands.get(name)!
    console.warn(`Deleting ${name}`)
    return client.application.commands.delete(existing.id)
  })
}
