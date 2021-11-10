import type { Message } from 'discord.js';

import { upsert, get } from './cacheFns.js';

export * from './cacheFns.js';

type ConditionLimit = { delay: number; type: string; meta?: unknown };

export function limitFnByUser<T extends (...args: unknown[]) => boolean | Promise<boolean>>(
  fn: T,
  { delay, type = `${fn.name}|${delay}` }: ConditionLimit
) {
  return async (msg: Message): Promise<boolean> => {
    const user = msg.author.id;
    const guild = msg.guild?.id;

    if(!guild) {
      return;
    }

    const prev = await get({ type, guild, user });

    if (prev) {
      return;
    }

    const result = await fn(msg);

    if (result) {
      await upsert({
        guild,
        user,
        type,
        expiresIn: delay,
        meta: typeof result === 'object' ? result : undefined,
      });
    }

    return result;
  };
}
