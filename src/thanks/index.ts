import { Message, Guild } from 'discord.js';

import { HELPFUL_ROLE_ID } from '../env';

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

export default (msg: Message) => {
  if (!msg.content.includes(userID_Delimiter.start)) return; // Break if no user has been mentioned

  const userID = extractUserID(msg.content);

  // Break if the user is trying to thank himself
  if (msg.author.id === userID) return;

  // Check if the mentioned user has the helpful role
  if (!isHelpfulUser(msg.guild, userID)) return;

  console.log(userID);
};
