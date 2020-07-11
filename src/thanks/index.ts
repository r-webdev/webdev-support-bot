import { Message, EmbedField } from 'discord.js';

import pointHandler from '../helpful_role/point_handler';
import { createEmbed } from '../utils/discordTools';

export const extractUserID = (s: string) =>
  s.includes('<@!') ? s.split('<@!')[1].split('>')[0] : null;

const handleThanks = async (msg: Message) => {
  if (msg.mentions.users.size === 0) {
    return; // Break if no user has been mentioned
  }

  const mentionedUsers = msg.mentions.users.filter(u => !u.bot);

  // Break if the user is trying to thank himself, or if no users have been mentioned
  if (
    mentionedUsers.size === 0 ||
    mentionedUsers.find(u => u.id === msg.author.id)
  ) {
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
          name: (i + 1).toString(),
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
