import { Message } from 'discord.js';

import pointHandler from '../helpful_role/point_handler';
import { createEmbed } from '../utils/discordTools';

export const extractUserID = (s: string) =>
  s.includes('<@!') ? s.split('<@!')[1].split('>')[0] : null;

const handleThanks = async (msg: Message) => {
  if (!msg.content.includes('<@!')) {
    return; // Break if no user has been mentioned
  }

  const userID = extractUserID(msg.content);

  // Break if the user is trying to thank himself
  if (msg.author.id === userID) {
    return;
  }

  const guildMember = msg.guild.members.cache.find(u => u.id === userID);

  // Break if there's no user or the user is a botD
  if (!guildMember || guildMember.user.bot) {
    return;
  }

  await pointHandler(userID, msg);

  const output = createEmbed({
    description: `<@!${msg.author.id}> has given a point to <@!${userID}>!`,
    footerText: 'Point Handler',
    provider: 'spam',
    title: `Point received!`,
  });

  await msg.channel.send(output);
};

export default handleThanks;
