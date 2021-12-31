// we need to await in a loop as we're rate-limited anyway
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  ApplicationCommand,
  ApplicationCommandData,
  ApplicationCommandManager,
  Client,
  Guild,
  GuildApplicationCommandManager,
  GuildResolvable,
  ApplicationCommandType,
} from 'discord.js';
import { Collection } from 'discord.js';
import { ApplicationCommandTypes } from 'discord.js/typings/enums';
import { filter } from 'domyno';
import { isEqual } from 'lodash-es';

import type { CommandDataWithHandler } from '../../types';
import { commands } from '../modules/modmail';
import { asyncCatch } from '../utils/asyncCatch.js';
import { map, mapʹ } from '../utils/map.js';
import { merge } from '../utils/merge.js';
import { normalizeApplicationCommandData } from '../utils/normalizeCommand.js';
import { pipe } from '../utils/pipe.js';
import { difference, intersection } from '../utils/sets.js';
// quick responses
// base commands
import { aboutInteraction } from './about/index.js';
import { mdnCommand } from './mdn/index.js';
import { npmInteraction } from './npm/index.js';
import { phpCommand } from './php/index.js';
import { pleaseInteraction } from './please/index.js';
import { pointsHandlers } from './points/index.js';
import { jobPostCommand } from './post/index.js';
import { resourceInteraction } from './resource/index.js';
// meme commands
import { shitpostInteraction } from './shitpost/index.js';
// import { warn } from './warn/index.js';
import { whynoInteraction } from './whyno/index.js';

export const guildCommands = new Map(
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
    whynoInteraction,
    ...commands,
    // warn // Not used atm
  ].map(command => [command.name, command])
); // placeholder for now

export const applicationCommands = new Collection<
  string,
  CommandDataWithHandler
>();

const getRelevantCmdProperties = ({
  description,
  name,
  type = ApplicationCommandTypes.CHAT_INPUT,
  options,
  defaultPermission = true,
}: {
  type?: ApplicationCommandTypes | ApplicationCommandType;
  description?: string;
  name: string;
  options?: unknown[];
  defaultPermission?: boolean;
}): ApplicationCommandData => {
  const relevantData = {
    type: _normalizeType(type),
    description,
    name,
    options,
    defaultPermission,
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

export const registerCommands = async (client: Client): Promise<void> => {
  client.on(
    'interactionCreate',
    asyncCatch(async interaction => {
      if (!interaction.isCommand() && !interaction.isContextMenu()) {
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
      } catch (error) {
        console.error(error);
        await interaction.reply({
          ephemeral: true,
          content: 'Something went wrong when trying to execute the command',
        });
      }
    })
  );

  for (const { onAttach } of applicationCommands.values()) {
    // We're attaching these so it's fine

    onAttach?.(client);
  }

  for (const { onAttach } of guildCommands.values()) {
    // We're attaching these so it's fine

    onAttach?.(client);
  }

  for (const [, oauth2Guild] of await client.guilds.fetch()) {
    let guild: { name: string } | Guild = { name: 'FAILED_TO_FETCH_GUILD' };
    try {
      guild = await oauth2Guild.fetch();
      const cmds = await (guild as Guild).commands.fetch();
      await addCommands(cmds, guildCommands, (guild as Guild).commands);
    } catch (error) {
      console.error(`Failed to add commands to guild: ${guild.name}`, error);
    }
  }
  console.log('Guild specific commands added');

  const discordCommandsById = await client.application.commands.fetch();
  await addCommands(
    discordCommandsById,
    applicationCommands,
    client.application.commands
  );

  console.log('General Commands All Added');
  // await client.application?.commands.set([{type:''}])
  // await client.guilds.cache.get('618935554171469834').commands.set([]);

  // client.guilds.cache.forEach(guild => {
  //   guild.commands.set([])
  // })
};

function _normalizeType(
  type: ApplicationCommandType | ApplicationCommandTypes
) {
  if (typeof type === 'number') {
    return type;
  }

  switch (type) {
    case 'MESSAGE':
      return ApplicationCommandTypes.MESSAGE;
    case 'USER':
      return ApplicationCommandTypes.USER;
    case 'CHAT_INPUT':
    default:
      return ApplicationCommandTypes.CHAT_INPUT;
  }
}

const interactionTypes = new Set(['CHAT_INPUT','USER','MESSAGE'])
async function addCommands(
  serverCommands: Collection<
    string,
    ApplicationCommand<{ guild: GuildResolvable }>
  >,
  commandDescriptions: Map<string, CommandDataWithHandler>,
  commandManager: ApplicationCommandManager | GuildApplicationCommandManager
) {
  const discordInteractionsById = serverCommands.filter(
    x => interactionTypes.has(x.type)
  );

  const discordCommands = new Collection(
    discordInteractionsById.map(value => [value.name, value])
  );

  const validCommands = pipe([
    filter<[string, CommandDataWithHandler]>(
      ([, val]: [string, CommandDataWithHandler]) =>
        'guild' in commandManager && val.guildValidate
          ? val.guildValidate(commandManager.guild)
          : true
    ),
    map(([key]): string => key),
  ]);

  const newCommands = difference(
    validCommands(commandDescriptions),
    discordCommands.keys()
  );
  const existingCommands = intersection(
    validCommands(commandDescriptions),
    discordCommands.keys()
  );
  const deletedCommands = difference<string>(
    discordCommands.keys(),
    validCommands(commandDescriptions)
  );

  // const new = await client.application.commands.create()
  await Promise.all(
    merge(
      createNewCommands(commandDescriptions, commandManager)(newCommands),
      editExistingCommands(
        commandDescriptions,
        commandManager,
        discordCommands
      )(existingCommands),
      deleteRemovedCommands(commandManager, discordCommands)(deletedCommands)
    )
  );
}

function getDestination(
  commandManager: ApplicationCommandManager | GuildApplicationCommandManager
) {
  return 'guild' in commandManager
    ? `Guild: ${commandManager.guild.name}`
    : 'App';
}

function createNewCommands(
  cmdDescriptions: Map<string, CommandDataWithHandler>,
  cmdMgr: ApplicationCommandManager | GuildApplicationCommandManager
) {
  const destination = getDestination(cmdMgr);
  return map(async (name: string) => {
    const command = cmdDescriptions.get(name);
    // this is always true
    if (command) {
      const { onAttach, handler, managePermissions, ...rest } = command;
      console.info(`Adding Command ${name} for ${destination}`);

      const guildCmd = await cmdMgr.create(rest);
      const { permissions, guild } = guildCmd;

      await managePermissions?.(guild, permissions);
    }
  });
}

function editExistingCommands(
  cmdDescriptions: Map<string, CommandDataWithHandler>,
  cmdMgr: ApplicationCommandManager | GuildApplicationCommandManager,
  existingCommands: Map<string, ApplicationCommand>
) {
  const destination = getDestination(cmdMgr);
  return map(async (name: string) => {
    const cmd = cmdDescriptions.get(name);
    const existing = existingCommands.get(name);

    const { onAttach, handler, managePermissions, ...command } = cmd;

    if (
      !isEqual(
        getRelevantCmdProperties(cmd),
        getRelevantCmdProperties(existing)
      )
    ) {
      console.info(`Updating ${name} for ${destination}`);
      console.log(
        getRelevantCmdProperties(cmd),
        getRelevantCmdProperties(existing))

      await cmdMgr.edit(existing.id, command);
    }

    try {
      const { permissions, guild } = existing;
      await managePermissions?.(guild, permissions);
    } catch (error) {
      console.log({ error });
    }
  });
}

function deleteRemovedCommands(
  cmdMgr: ApplicationCommandManager | GuildApplicationCommandManager,
  existingCommands: Map<string, ApplicationCommand>
) {
  const destination = getDestination(cmdMgr);
  return map(async (name: string) => {
    const existing = existingCommands.get(name)!;
    console.warn(`Deleting ${name} from ${destination}`);

    await cmdMgr.delete(existing.id);
  });
}
