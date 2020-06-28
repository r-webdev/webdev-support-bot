import { Message } from 'discord.js';

const USER_ID_DELIMITER = '<@!';

const extractUserID = (s: string) =>
  s.split(USER_ID_DELIMITER)[1].replace('>', '');

export default (msg: Message) => {
  if (!msg.content.includes(USER_ID_DELIMITER)) return; // Break if no user has been mentioned
  console.log(extractUserID(msg.content));
};
