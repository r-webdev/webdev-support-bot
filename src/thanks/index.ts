import { Message, EmbedField } from 'discord.js';

import { POINT_LIMITER_IN_MINUTES } from '../env';
import pointHandler, {
  generatePointsCacheEntryKey,
} from '../helpful_role/point_handler';
import { cache } from '../spam_filter';
import { createEmbed } from '../utils/discordTools';

type CooldownUser = {
  id: string;
  timestamp: number;
};

export const extractUserID = (s: string) =>
  s.includes('<@!') ? s.split('<@!')[1].split('>')[0] : null;

const timeUntilCooldownReset = (entry: number) =>
  Math.round(
    Number.parseInt(POINT_LIMITER_IN_MINUTES) - (Date.now() - entry) / 60000
  );

const handleThanks = async (msg: Message) => {
  if (msg.mentions.users.size === 0) {
    return; // Break if no user has been mentioned
  }

  /**
   * Filter out all unwanted users.
   * A unwanted user is anyone who's a bot, is the actual message author itself,
   * or if the user's already been given a point by the message author.
   */

  const usersOnCooldown: CooldownUser[] = [];

  const mentionedUsers = msg.mentions.users.filter(u => {
    const entry: number = cache.get(
      generatePointsCacheEntryKey(u.id, msg.author.id)
    );

    if (entry) {
      usersOnCooldown.push({ id: u.id, timestamp: entry });
    }

    return !u.bot && u.id !== msg.author.id && !entry;
  });

  if (usersOnCooldown.length > 0) {
    const dm = await msg.author.createDM();

    dm.send(
      createEmbed({
        description:
          'You cannot thank the following users for the period of time shown below their names:',
        fields: usersOnCooldown.map((u, i) => {
          const diff = timeUntilCooldownReset(u.timestamp);
          return {
            inline: false,
            name: `${i + 1}`,
            value: `<@!${u.id}>\n${diff} minute${diff === 1 ? '' : 's'}.`,
          };
        }),
        footerText: `You can only give a point to a user every ${POINT_LIMITER_IN_MINUTES} minute${
          Number.parseInt(POINT_LIMITER_IN_MINUTES) === 1 ? '' : 's'
        }.`,
        provider: 'spam',
        title: 'Cooldown alert!',
      })
    );
  }

  // Break if no valid users remain
  if (mentionedUsers.size === 0) {
    return;
  }

  mentionedUsers.forEach(async user => await pointHandler(user.id, msg));

  const title = `Point${mentionedUsers.size === 1 ? '' : 's'} received!`;

  const description = `<@!${msg.author.id}> has given a point to ${
    mentionedUsers.size === 1
      ? `<@!${mentionedUsers.first().id}>`
      : 'the users mentioned below'
  }!`;

  const fields: EmbedField[] =
    mentionedUsers.size > 1
      ? mentionedUsers.array().map((u, i) => ({
          inline: false,
          name: (i + 1).toString() + '.',
          value: `<@!${u.id}>`,
        }))
      : [];

  const output = createEmbed({
    description,
    fields,
    footerText: 'Point Handler',
    provider: 'spam',
    title,
  });

  await msg.channel.send(output);
};

export default handleThanks;
