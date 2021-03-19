import {
  ApplicationCommand,
  Client,
  Collection,
  Guild,
  Interaction,
} from 'discord.js';
import { pipe, filter, map } from 'domyno';
import { debounce } from 'lodash';
import { pluckʹ } from '../../v1/utils/pluck';

import {
  CommandData,
  deleteCommand,
  getCommands,
  registerGuildCommand,
  registerCommand,
} from '../interactions';
import { difference } from '../utils/sets';

type InternalCommand = Omit<ApplicationCommand, 'application_id' | 'guild_id'>;

const guildCommandMap: Map<
  Guild['id'],
  Collection<string, InternalCommand>
> = new Map();
const registeredCommands: Map<string, CommandData> = new Map();

let _client!: Client;

const getResolvedValues = pipe(
  filter(item => (item.status === 'fulfilled' ? true : console.log(item))),
  map(item => item.value)
);

const transformExternalCommands = pipe(
  map<ApplicationCommand, InternalCommand>(item => {
    const { application_id, guild_id, ...rest } = item;
    return [rest.name, rest];
  }),
  (iterable: Iterable<[string, InternalCommand]>) => new Map(iterable)
);

const queueSyncCommands = debounce(syncCommands);

export function registerCommands(...commandData: CommandData[]) {
  for (const commandDatum of commandData) {
    registerCommand(commandDatum);
  }

  if (_client) {
    queueSyncCommands();
  }
}

async function syncCommands() {
  console.log('sync commands');
  const results = await Promise.all(
    map(async ([guild, commandData]) => {
      const commands = [...pluckʹ(commandData.values(), 'name')];
      const missingCommands = difference(registeredCommands.keys(), commands);
      const extraCommands = difference(commands, registeredCommands.keys());

      return [
        ...(await Promise.allSettled(
          map(name => {
            deleteCommand(_client, guild, commandData.get(name).id);
          })(extraCommands)
        )),

        ...(await Promise.allSettled(
          map(name => {
            registerGuildCommand(_client, guild, registeredCommands.get(name));
          })(missingCommands)
        )),
      ];
    })(guildCommandMap)
  );

  const failedResults = results
    .flat()
    .filter(
      (item: PromiseSettledResult<unknown>) => item.status === 'rejected'
    );

  if (failedResults.length) {
    console.error(failedResults);
  } else {
    console.log('no errors');
  }
}

// load the commands from each
export async function initCommands(client: Client) {
  const guildCommands = await Promise.allSettled(
    client.guilds.cache.map(async ({ id }) => [
      id,
      await getCommands(client, id),
    ])
  );

  for (const [id, commands] of getResolvedValues(guildCommands)) {
    guildCommandMap.set(id, transformExternalCommands(commands));
  }

  _client = client;

  queueSyncCommands();
}
