import { SERVER_ID } from '../../../env';

export function limitToWebDevServer<
  HasGuildId extends { guild: { id: string } },
  Output,
  VArgs extends ReadonlyArray<unknown>
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
