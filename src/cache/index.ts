import { Message } from 'discord.js';
import { upsert, get } from './cacheFns';
export * from './cacheFns';

type ConditionLimit = { delay: number; type: string; meta?: unknown };

export function limitFnByUser<T extends (...args: any[]) => any>(
  fn: T,
  { delay, type = `${fn.name}|${delay}` }: ConditionLimit
) {
  return async function (msg: Message) {
    const user = msg.author.id;
    const guild = msg.guild.id;

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
  };
}
