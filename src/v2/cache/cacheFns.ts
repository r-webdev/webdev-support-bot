/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GenericCache } from './model.js';

export type CacheUpsertOptions = {
  guild: string;
  type: string;
  user: string;
  meta?: unknown;
} & (
  | {
      expiresIn: number;
    }
  | { expiresAt: number }
);

export type CacheFindOptions = {
  type: string;
  user: string;
  guild: string;
};

export async function get({ type, user, guild }: CacheFindOptions) {
  await _purge();
  return GenericCache.findOne({
    type,
    user,
    guild,
    timestamp: { $gte: Date.now() },
  });
}

export async function upsert(options: CacheUpsertOptions) {
  const { guild, type, user, meta } = options;

  // Cannot use destructuring due to the properties being optional and TS not liking it
  // eslint-disable-next-line unicorn/consistent-destructuring
  const expireTime = "expiresAt" in options ? options.expiresAt : Date.now() + options.expiresIn;

  const result = await GenericCache.findOneAndUpdate(
    {
      guild,
      type,
      user,
      timestamp: {
        $gte: expireTime,
      },
    },
    { meta, timestamp: expireTime },
    { upsert: true }
  );
  await _purge();
  return result;
}

export async function clear({ guild, type, user }: CacheFindOptions) {
  await _purge();
  return GenericCache.deleteOne({ guild, type, user });
}

async function _purge() {
  return GenericCache.deleteMany({
    timestamp: { $lt: Date.now() },
  });
}
