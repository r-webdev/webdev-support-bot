import { Message } from 'discord.js';

import pointHandler from '../helpful_role/point_handler';
import { createEmbed } from '../utils/discordTools';

export const extractUserID = (s: string) => s.split('<@!')[1].split('>')[0];

export default async (msg: Message) => {
  if (!msg.content.includes('<@!')) return; // Break if no user has been mentioned

  const userID = extractUserID(msg.content);

  // Break if the user is trying to thank himself
  if (msg.author.id === userID) return;

  await pointHandler(userID, msg);

  const output = createEmbed({
    description: `<@!${msg.author.id}> has given a point to <@!${userID}>!`,
    footerText: 'Point Handler',
    provider: 'spam',
    title: `Point received!`,
  });

  msg.channel.send(output);
};
