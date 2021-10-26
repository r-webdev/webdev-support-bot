/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandManager,
  Client,
  GuildApplicationCommandManager,
  GuildResolvable,
} from 'discord.js';
import { Collection } from 'discord.js';
import _ from 'lodash';
import { CommandDataWithHandler } from '../../types';
import { asyncCatch } from '../utils/asyncCatch';

import { map } from '../utils/map';
import { merge } from '../utils/merge';
import { normalizeApplicationCommandData } from '../utils/normalizeCommand';
import { difference, intersection } from '../utils/sets';
// quick responses
// base commands
import { aboutInteraction } from './about';
import { mdnCommand } from './mdn';
import { npmInteraction } from './npm';
import { phpCommand } from './php';
import { pleaseInteraction } from './please';
import { pointsHandlers } from './points';
import { jobPostCommand } from './post';
import { resourceInteraction } from './resource';
// meme commands
import { shitpostInteraction } from './shitpost';

Error.stackTraceLimit = Infinity;

export const applicationCommands = new Collection<
  string,
  CommandDataWithHandler
>();

const getRelevantCmdProperties = ({
  description,
  name,
  options,
}: {
  description: string;
  name: string;
  options?: unknown[];
}): ApplicationCommandData => {
  const relevantData = {
    description,
    name,
    options,
  } as unknown as ApplicationCommandData;
  return stripNullish(normalizeApplicationCommandData(relevantData));
};

const stripNullish = <T>(obj: T): T => {
  if (typeof obj !== 'object' && obj !== null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripNullish) as typeof obj;
  }

  return Object.fromEntries(
    Object.entries(obj)
      .map(([a, b]) => [a, stripNullish(b)])
      .filter(([, b]) => b != null)
  ) as T;
};

const guildCommands = new Map(
  [
    aboutInteraction,
    mdnCommand,
    phpCommand,
    pleaseInteraction,
    pointsHandlers,
    jobPostCommand,
    resourceInteraction,
    shitpostInteraction,
    npmInteraction,
  ].map(command => [command.name, command])
); // placeholder for now

export const registerCommands = async (client: Client): Promise<void> => {
  client.on(
    'interactionCreate',
    asyncCatch(async interaction => {
      if (!interaction.isCommand()) {
        return;
      }

      try {
        if (applicationCommands.has(interaction.commandName)) {
          await applicationCommands
            .get(interaction.commandName)
            ?.handler(client, interaction);
        } else if (guildCommands.has(interaction.commandName)) {
          await guildCommands
            .get(interaction.commandName)
            ?.handler(client, interaction);
        } else {
          await interaction.reply({
            ephemeral: true,
            content: "Couldn't recognize command.",
          });
        }
      } catch (e) {
        console.error(e);
        await interaction.reply({
          ephemeral: true,
          content: 'Something went wrong when trying to execute the command',
        });
      }
    })
  );

  for (const { onAttach } of applicationCommands.values()) {
    // We're attaching these so it's fine
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    onAttach?.(client);
  }

  for (const { onAttach } of guildCommands.values()) {
    // We're attaching these so it's fine
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    onAttach?.(client);
  }

  for (const [, oauth2Guild] of await client.guilds.fetch()) {
    const guild = await oauth2Guild.fetch();
    const cmds = await guild.commands.fetch();
    await addCommands(cmds, guildCommands, guild.commands);
  }

  const discordCommandsById = await client.application.commands.fetch();
  await addCommands(
    discordCommandsById,
    applicationCommands,
    client.application.commands
  );

  console.log('General Commands All Added');
  // await client.application?.commands.set([{type:''}])
  // await client.guilds.cache.get('618935554171469834').commands.set([]);

  console.log('Guild specific commands added');
  // client.guilds.cache.forEach(guild => {
  //   guild.commands.set([])
  // })
};

async function addCommands(
  serverCommands: Collection<
    string,
    ApplicationCommand<{ guild: GuildResolvable }>
  >,
  commandDescriptions: Map<string, CommandDataWithHandler>,
  commandManager: ApplicationCommandManager | GuildApplicationCommandManager
) {
  const discordChatInputCommandsById = serverCommands.filter(
    x => x.type === 'CHAT_INPUT'
  );

  const discordCommands = new Collection(
    discordChatInputCommandsById.map(value => [value.name, value])
  );

  const newCommands = difference(
    commandDescriptions.keys(),
    discordCommands.keys()
  );
  const existingCommands = intersection(
    commandDescriptions.keys(),
    discordCommands.keys()
  );
  const deletedCommands = difference<string>(
    discordCommands.keys(),
    commandDescriptions.keys()
  );

  // const new = await client.application.commands.create()
  await Promise.all(
    merge(
      createNewCommands(commandDescriptions, commandManager)(newCommands),
      editExistingCommands(commandDescriptions, commandManager, discordCommands)(existingCommands),
      deleteRemovedCommands(commandManager, discordCommands)(deletedCommands)
    )
  );
}

function createNewCommands(
  cmdDescriptions: Map<string, CommandDataWithHandler>,
  cmdMgr: ApplicationCommandManager | GuildApplicationCommandManager
) {
  return map(async (name: string) => {
    const command = cmdDescriptions.get(name);
    // this is always true
    if (command) {
      const { onAttach, handler, ...rest } = command;
      console.info(`Creating ${name}`);

      return cmdMgr.create(rest);
    }
  });
}

function editExistingCommands(
  cmdDescriptions: Map<string, CommandDataWithHandler>,
  cmdMgr: ApplicationCommandManager | GuildApplicationCommandManager,
  existingCommands: Map<string, ApplicationCommand>
) {
  return map((name: string) => {
    const cmd = cmdDescriptions.get(name);
    const existing = existingCommands.get(name);

    const { onAttach, handler, ...command } = cmd;

    if (
      !_.isEqual(
        getRelevantCmdProperties(cmd),
        getRelevantCmdProperties(existing)
      )
    ) {
      console.info(`Updating ${name}`);

      console.log(
        getRelevantCmdProperties(cmd),
        getRelevantCmdProperties(existing)
      );

      return cmdMgr.edit(existing.id, command);
    }
  });
}

function deleteRemovedCommands(
  cmdMgr: ApplicationCommandManager | GuildApplicationCommandManager,
  existingCommands: Map<string, ApplicationCommand>
) {
  return map(async (name: string) => {
    const existing = existingCommands.get(name)!;
    console.warn(`Deleting ${name}`);

    return cmdMgr.delete(existing.id);
  });
}
