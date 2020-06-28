import { Message, Guild } from 'discord.js';

import { HELPFUL_ROLE_ID } from '../env';
import pointHandler from '../helpful_role/point_handler';
import { createEmbed } from '../utils/discordTools';

const userID_Delimiter = { end: '>', start: '<@!' };

const isHelpfulUser = (guild: Guild, userID: string) => {
  // Find the mentioned user within the guild
  const user = guild.members.cache.find(u => u.id === userID);
  if (!user) return false;

  // Check if user has the helpful role
  return user.roles.cache.find(r => r.id === HELPFUL_ROLE_ID);
};

const extractUserID = (s: string) =>
  s.split(userID_Delimiter.start)[1].replace(userID_Delimiter.end, '');

export default async (msg: Message) => {
  if (!msg.content.includes(userID_Delimiter.start)) return; // Break if no user has been mentioned

  const userID = extractUserID(msg.content);

  // Break if the user is trying to thank himself
  if (msg.author.id === userID) return;

  // Check if the mentioned user has the helpful role
  if (!isHelpfulUser(msg.guild, userID)) return;

  await pointHandler(userID);

  const output = createEmbed({
    description: `<@!${msg.author.id}> has given a point to <@!${userID}>!`,
    footerText: 'Point Handler',
    provider: 'spam',
    title: `Point received!`,
  });

  msg.channel.send(output);
};
