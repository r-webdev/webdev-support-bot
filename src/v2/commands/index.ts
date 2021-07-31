import type { ApplicationCommandData, Client} from 'discord.js';
import { Collection } from 'discord.js';

// quick responses
import type { CommandDataWithHandler } from '../../types';
import { map } from '../utils/map';
import { pipe } from '../utils/pipe';
import { aboutInteraction} from './about';

// base commands
import { mdnCommand} from './mdn';
import { npmInteraction } from './npm'
import {phpCommand } from './php';
import { pleaseInteraction} from './please';
import {pointsHandlers } from './points';
import { jobPostCommand } from './post';
import { resourceInteraction} from './resource';

// meme commands
import { shitpostInteraction} from './shitpost';

const applicationCommands = new Collection([
  aboutInteraction,
  mdnCommand,
  phpCommand,
  pleaseInteraction,
  pointsHandlers,
  jobPostCommand,
  resourceInteraction,
  shitpostInteraction,
  npmInteraction
].map(command => [command.name, command]))

const mapCommandData = pipe<Iterable<CommandDataWithHandler>, ApplicationCommandData[]>([
  map(({ handler, ...rest}) => rest),
  ([...result]) => result
])

const guildCommands = new Collection([]) // placeholder for now

export const registerCommands = async (client:Client): Promise<void> => {

  await client.application?.commands.set(mapCommandData(applicationCommands.values()))

  // client.guilds.cache.forEach(guild => {
  //   guild.commands.set([])
  // })

  client.on('interactionCreate', interaction => {
    if(!interaction.isCommand()) {return}

    try {
      if(applicationCommands.has(interaction.commandName)) {
        applicationCommands.get(interaction.commandName)?.handler(client,interaction);
      } else {
        interaction.reply({ ephemeral: true, content: "Couldn't recognise command."});
      }
    } catch {
      interaction.reply({ ephemeral: true, content: "Something went wrong when trying to execute the command"});
    }
  })
}
