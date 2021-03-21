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

const collator = new Intl.Collator('en-US');

const sortKeys = obj => {
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  return Object.fromEntries(
    Object.entries(obj)
      .sort(([a], [b]) => collator.compare(a, b))
      .map(([key, val]) => [key, sortKeys(val)])
  );
};

const transformToBaseCommandData = obj =>
  sortKeys({
    name: obj.name,
    description: obj.description,
    ...(obj.options && { options: obj.options }),
  });

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
    map(
      async ([guild, commandData]: [
        string,
        Collection<string, InternalCommand>
      ]) => {
        const registeredCommands = getRegisteredCommands();
        const commandNames = [...pluckʹ(commandData.values(), 'name')];

        const getChangedCommands = pipe(
          map(name => [
            transformToBaseCommandData(registeredCommands.get(name)),
            transformToBaseCommandData(commandData.get(name)),
          ]),
          filter(([registeredCommand, guildCommand]) => {
            const registeredJson = JSON.stringify(registeredCommand);
            const guildJson = JSON.stringify(guildCommand);
            return registeredJson !== guildJson;
          }),
          map(([{ name }]) => name)
        );

        // to be added
        const missingCommands = difference(
          registeredCommands.keys(),
          commandNames
        );
        // / To be deleted
        const extraCommands = difference(
          commandNames,
          registeredCommands.keys()
        );

        const updateCommands = getChangedCommands(
          difference(commandNames, missingCommands)
        );
        const existingCommands = intersection(
          commandNames,
          registeredCommands.keys()
        );

        console.log({
          missingCommands,
          existingCommands,
          extraCommands,
          commandData,
        });

        return [
          ...(await Promise.allSettled(
            map(name =>
              deleteCommand(_client, guild, commandData.get(name).id)
            )(extraCommands)
          )),

          ...(await Promise.allSettled(
            map((name: string) =>
              registerGuildCommand(_client, guild, registeredCommands.get(name))
            )(new Set([...missingCommands, ...updateCommands]))
          )),
        ];
      }
    )(guildCommandMap)
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
