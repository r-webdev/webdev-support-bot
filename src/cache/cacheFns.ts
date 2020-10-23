import { GenericCache } from './model';

export type CacheUpsertOptions = {
  guild: string;
  type: string;
  expiresIn: number;
  user: string;
  meta?: unknown;
};

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

export async function upsert({
  expiresIn,
  guild,
  type,
  user,
  meta,
}: CacheUpsertOptions) {
  const expireTime = Date.now() + expiresIn;
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
