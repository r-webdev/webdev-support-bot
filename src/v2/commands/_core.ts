import type { ApplicationCommand, Client, Collection, Guild } from 'discord.js';
import { pipe, filter, map, zip } from 'domyno';
import { debounce } from 'lodash';

import { pluckʹ } from '../../v1/utils/pluck';
import type { CommandData } from '../interactions';
import { getRegisteredCommands } from '../interactions';
import {
  deleteCommand,
  getCommands,
  registerGuildCommand,
  registerCommand,
} from '../interactions';
import { mapʹ } from '../utils/map';
import { difference, intersection } from '../utils/sets';

type InternalCommand = Omit<ApplicationCommand, 'application_id' | 'guild_id'>;

const guildCommandMap: Map<
  Guild['id'],
  Collection<string, InternalCommand>
> = new Map();

let _client!: Client;

const getResolvedValues = (
  client: Client,
  guildCommands: PromiseSettledResult<ApplicationCommand[]>[]
) =>
  zip(
    client.guilds.cache.keys(),
    mapʹ(
      promiseResult =>
        promiseResult.status === 'fulfilled' ? promiseResult.value : [],
      guildCommands
    )
  );
const transformExternalCommands = pipe(
  map<ApplicationCommand, InternalCommand>(item => {
    const { application_id, guild_id, ...rest } = item;
    return [rest.name, rest];
  }),
  (iterable: Iterable<[string, InternalCommand]>) => new Map(iterable)
);

const queueSyncCommands = debounce(syncCommands);

export function registerCommands(...commandData: CommandData[]): void {
  for (const commandDatum of commandData) {
    registerCommand(commandDatum);
  }

  if (_client) {
    queueSyncCommands();
  }
}

async function syncCommands() {
  const results = await Promise.all(
    map(async ([guild, commandData]) => {
      const registeredCommands = getRegisteredCommands();
      const commands = [...pluckʹ(commandData.values(), 'name')];
      const missingCommands = difference(registeredCommands.keys(), commands);
      const extraCommands = difference(commands, registeredCommands.keys());
      const existingCommands = intersection(
        commands,
        registeredCommands.keys()
      );

      console.log({ missingCommands, existingCommands, extraCommands });

      return [
        ...(await Promise.allSettled(
          map(name => deleteCommand(_client, guild, commandData.get(name).id))(
            extraCommands
          )
        )),

        ...(await Promise.allSettled(
          map((name: string) =>
            registerGuildCommand(_client, guild, registeredCommands.get(name))
          )(missingCommands)
        )),
      ];
    })(guildCommandMap)
  );

  const failedResults = results
    .flat()
    .filter(
      (item: PromiseSettledResult<unknown>) => item.status === 'rejected'
    );

  if (failedResults.length > 0) {
    // console.error(failedResults);
  } else {
    console.log('no errors');
  }
}

// load the commands from each
export async function initCommands(client: Client): Promise<void> {
  const guildCommands = await Promise.allSettled(
    client.guilds.cache.map(async ({ id }) => getCommands(client, id))
  );

  for (const [id, commands] of getResolvedValues(client, guildCommands)) {
    guildCommandMap.set(id, transformExternalCommands(commands));
  }

  _client = client;

  queueSyncCommands();
}
