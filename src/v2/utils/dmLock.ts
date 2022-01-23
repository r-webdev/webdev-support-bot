import { clear, get, purgeType, upsert } from '../cache';

const TYPE = 'DM_LOCK';

export async function lock(
  guild: string,
  user: string,
  owner: string
): Promise<boolean> {
  const cache = await get({
    type: TYPE,
    guild,
    user,
  });

  if (!cache) {
    await upsert({
      type: TYPE,
      guild,
      user,
      meta: {
        owner,
      },
      expiresAt: Number.MAX_SAFE_INTEGER,
    });
    return true;
  }

  return false;
}

export async function unlock(
  guild: string,
  user: string,
  owner: string
): Promise<boolean> {
  const cache = await get({
    type: TYPE,
    guild,
    user,
  });

  if ((cache?.meta as { owner: string }).owner !== owner) {
    return false;
  }

  await clear({
    type: TYPE,
    guild,
    user,
  });
  return true;
}

export async function hasLock(
  guild: string,
  user: string,
  owner: string
): Promise<boolean> {
  const cache = await get({
    type: TYPE,
    guild,
    user,
  });

  return (cache?.meta as { owner: string }).owner === owner;
}

export async function isLocked(guild: string, user: string): Promise<boolean> {
  return Boolean(await get({ type: TYPE, guild, user }));
}

export async function purge(guild: string): Promise<void> {
  await purgeType({
    guild,
    type: TYPE,
  });
}
