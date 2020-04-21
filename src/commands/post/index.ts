import * as errors from '../../utils/errors';
import { createEmbed } from '../../utils/discordTools';
import { Message, CollectorFilter } from 'discord.js';
import questions from './questions';

const trimAndLowerContent = (s: string): string => s.trim().toLowerCase();

const getReply = async (channel, filter: CollectorFilter) => {
  const res = await channel.awaitMessages(filter, { max: 1, time: 60000 }); // Timeout in a minute
  const content = trimAndLowerContent(res.first().content);
  return content === 'cancel' ? false : content; // Return false if the user explicitly cancels the form
};

function handleNewJobPost({ answers, guild, username, discriminator }) {
  // Data is the answers map returned from the new command
  let response = `@${username}#${discriminator} has posted a new job.`;
  const targetChannel = guild.channels.cache.find(
    ({ name }) => name === process.env.JOB_POSTINGS_CHANNEL
  );
  if (!targetChannel) console.error('Channel does not exist.');
  for (let [key, value] of answers) {
    response += '\n' + '```\n' + `${key}: ${value}` + '\n```';
  }
  targetChannel.send(response);
}

const handleJobPostingRequest = async (msg: Message) => {
  try {
    const filter: CollectorFilter = (m) => m.author.id === msg.author.id;
    const send = (str) => msg.author.send(str);
    const { guild } = msg;
    const { username, discriminator } = msg.author;
    // Notify the user regarding the rules, and get the channel
    const { channel }: Message = await send(
      'Heads up!\nPosts without financial compensation are not allowed. This includes any kind of equity. Trying to circumvent this in any way will result in a ban.\nIf you are not willing to continue, type `cancel`.\nOtherwise, type `ok` to continue.'
    );
    const proceed = await getReply(channel, filter);
    if (!proceed) return send('Canceled.');
    const answers = new Map();
    // Iterate over questions
    for (const key in questions) {
      // Check if the current question is the location question
      if (key === 'location') {
        // Check if the `isRemote` value has been set to "yes"
        const isRemote = answers.get('isRemote');
        // If the value is set to "yes", skip this iteration
        if (isRemote === 'yes') continue;
      }
      const q = questions[key];
      // Send out the question
      await send(q.body);
      // Await the input
      const reply = await getReply(channel, filter);
      // If the reply is equal to "cancel", cancel the form
      if (!reply)
        return await send('Explicitly cancelled job post form. Exiting...');
      // If there is a validation method appended to the question, use it
      if (!q.validate) {
        answers.set(key, reply);
        continue;
      }
      // If the input is not valid, cancel the form and notify the user.
      const isValid = q.validate(reply);
      if (!isValid) return await send('Invalid input. Cancelling form.');
      // Otherwise, store the answer in the output map
      answers.set(key, reply);
    }
    return handleNewJobPost({ answers, guild, username, discriminator });
  } catch (error) {
    console.error(error);
    await msg.author.send(errors.unknownError);
  }
};

export default handleJobPostingRequest;
