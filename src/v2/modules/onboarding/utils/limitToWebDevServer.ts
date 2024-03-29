import { SERVER_ID } from '../../../env.js';

export function limitToWebDevServer<
  HasGuildId extends { guild: { id: string } },
  Output,
  VArgs extends readonly unknown[]
>(
  fn: (g: HasGuildId, ...vargs: VArgs) => Output
): (a: HasGuildId, ...vargs: VArgs) => Output {
  return (x: HasGuildId, ...args: VArgs) => {
    if (x.guild.id !== SERVER_ID) {
      return;
    }

    return fn(x, ...args);
  };
}
