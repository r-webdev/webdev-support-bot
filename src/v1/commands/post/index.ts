import {
  Message,
  CollectorFilter,
  TextChannel,
  DMChannel,
  NewsChannel,
  Guild,
  GuildChannel,
  MessageEmbed,
} from 'discord.js';

import { cache } from '../../spam_filter';
import { createEmbed, createMarkdownCodeBlock } from '../../utils/discordTools';
import {
  AWAIT_MESSAGE_TIMEOUT,
  MOD_CHANNEL,
  JOB_POSTINGS_CHANNEL,
  POST_LIMITER,
  POST_LIMITER_IN_HOURS,
  MINIMAL_COMPENSATION,
  MINIMAL_AMOUNT_OF_WORDS,
} from './env';
import questions from './questions';

export type OutputField = {
  name: string;
  value: string;
  inline: boolean;
};

type Metadata = {
  username: string;
  discriminator: string;
  msgID?: string;
  userID?: string;
};

type Channel = TextChannel | NewsChannel | DMChannel;

type Answers = Map<string, string>;

type CacheEntry = {
  key: string;
  value: Date;
};

export interface TargetChannel extends GuildChannel {
  send?: (
    message: string | { embed: Partial<MessageEmbed> }
  ) => Promise<Message>;
}

enum Days {
  Sunday = 0,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

enum Months {
  January = 0,
  February,
  March,
  April,
  May,
  June,
  July,
  August,
  September,
  October,
  November,
  December,
}

const getCurrentDate = () => {
  const date = new Date();

  return `${Days[date.getDay()]}, ${
    Months[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;
};

/*
  The `capitalize` function does **not** capitalize only one word in a string.
  It capitalizes all words present in the string itself, separated with a space.
*/

export const capitalize = (str: string) =>
  str
    .split(' ')
    .map(s => `${s[0].toUpperCase()}${s.slice(1).toLowerCase()}`)
    .join(' ');

const getTargetChannel = (guild: Guild, name: string): TargetChannel =>
  guild.channels.cache.find(({ name: n }) => n === name);

const generateURL = (guildID: string, channelID: string, msgID: string) =>
  `https://discordapp.com/channels/${guildID}/${channelID}/${msgID}`;

const getReply = async (
  channel: Channel,
  filter: CollectorFilter,
  timeMultiplier: number = 1
) => {
  try {
    const res = await channel.awaitMessages(filter, {
      max: 1,
      time: AWAIT_MESSAGE_TIMEOUT * timeMultiplier,
    });

    const content = res.first().content.trim();

    return content.toLowerCase() === 'cancel' ? false : content; // Return false if the user explicitly cancels the form
  } catch {
    channel.send('You have timed out. Please try again.');
  }
};

const sendAlert = (
  guild: Guild,
  userInput: string,
  { username, discriminator }: Metadata
): void => {
  const targetChannel = getTargetChannel(guild, MOD_CHANNEL);

  if (!targetChannel) {
    // eslint-disable-next-line no-console
    console.warn(
      'env.MOD_CHANNEL does not exist on this server - via post.sendAlert'
    );
    return;
  }

  const user = createUserTag(username, discriminator);

  try {
    targetChannel.send(
      createEmbed({
        description:
          'A user attempted creating a job post whilst providing invalid compensation.',
        fields: [
          {
            inline: true,
            name: 'User',
            value: user,
          },
          {
            inline: false,
            name: 'Input',
            value: createMarkdownCodeBlock(userInput),
          },
          {
            inline: false,
            name: 'Command',
            value: createMarkdownCodeBlock(
              `?ban ${user} Invalid compensation.`
            ),
          },
          {
            inline: false,
            name: 'Message Link',
            value: 'DM Channel - Not Applicable.',
          },
        ],
        footerText: 'Job Posting Module',
        provider: 'spam',
        title: 'Alert!',
        url: 'https://discord.gg/',
      })
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('post.sendAlert', error);
  }
};

const generateFields = (answers: Answers): OutputField[] => {
  const response = [];

  for (let [key, value] of answers) {
    if (key === 'compensation')
      value = value.includes('$') ? value : `${value}$`;

    /* 
      If the value is "no", don't print the location field.
      The location field is optional.
    */
    if (key === 'location' && value.toLowerCase() === 'no') continue;

    response.push({
      inline: false,
      name: capitalize(key.replace('_', ' ')),
      value: createMarkdownCodeBlock(
        key === 'compensation_type' || key === 'remote'
          ? capitalize(value)
          : value
      ),
    });
  }

  return response;
};

const createUserTag = (username: string, discriminator: string) =>
  `${username}#${discriminator}`;

const createJobPost = async (
  answers: Answers,
  guild: Guild,
  channelID: string,
  { username, discriminator, msgID, userID }: Metadata
) => {
  const targetChannel = getTargetChannel(guild, JOB_POSTINGS_CHANNEL);

  if (!targetChannel) {
    // eslint-disable-next-line no-console
    console.warn(
      'env.JOB_POSTINGS_CHANNEL does not exist on this server - via post.createJobPost'
    );
    return;
  }

  const user = createUserTag(username, discriminator);
  const url = generateURL(guild.id, channelID, msgID);

  try {
    const msg = await targetChannel.send(
      createEmbed({
        author: {
          name: user,
        },
        description: `A user has created a new job post!`,
        // Using the spam provider because we only need the color/icon, which it provides anyway
        fields: [
          {
            inline: true,
            name: 'User',
            value: `<@!${userID}>`,
          },
          {
            inline: true,
            name: 'Created At',
            value: getCurrentDate(),
          },
          ...generateFields(answers),
        ],

        footerText: 'Job Posting Module',

        provider: 'spam',

        title: 'New Job Post',
        url,
      })
    );

    return generateURL(guild.id, msg.channel.id, msg.id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('post.createJobPost', error);
  }
};

const formAndValidateAnswers = async (
  channel: Channel,
  filter: CollectorFilter,
  guild: Guild,
  send: Function,
  { username, discriminator }: Metadata
): Promise<Answers> => {
  const answers = new Map();

  // Iterate over questions
  for (const key in questions) {
    // Check if the current question is the location question
    if (key === 'location') {
      // Check if the `isRemote` value has been set to "yes"
      const isRemote = answers.get('remote').toLowerCase();
      // If the value is set to "yes", skip this iteration
      if (isRemote === 'yes') {
        continue;
      }
    }

    const q = questions[key];
    // Send out the question
    await send(q.body);
    // Await the input
    const reply = await getReply(
      channel,
      filter,
      // Increase the timeout up to 5x of `AWAIT_TIMEOUT` when waiting for the job description
      key === 'description' ? 5 : 1
    );

    // If the reply is equal to "cancel" (aka, returns false), cancel the form
    if (!reply) {
      await send('Explicitly cancelled job post form. Exiting.');
      return;
    }

    // If there is a validation method appended to the question, use it
    if (!q.validate) {
      answers.set(key, reply);
      continue;
    }

    // If the input is not valid, cancel the form and notify the user.
    const isValid = q.validate(reply.toLowerCase());

    if (!isValid) {
      switch (key) {
        case 'compensation':
          // Alert the moderators if the compensation is invalid.
          await sendAlert(guild, reply, { discriminator, username });
          break;
        case 'description':
          await send(
            `The job description should contain more than ${MINIMAL_AMOUNT_OF_WORDS} words.`
          );
          break;
      }
      await send('Invalid input. Cancelling form.');
      return;
    }

    // Otherwise, store the answer in the output map
    answers.set(key, reply);
  }

  return answers;
};

const generateCacheEntry = (key: string): CacheEntry => ({
  key: `jp-${key}`, // JP stands for Job Posting, for the sake of key differentiation
  value: new Date(),
});

const greeterMessage = `Please adhere to the following guidelines when creating a job posting:
${createMarkdownCodeBlock(
  `
1. Your job must provide monetary compensation.\n
2. Your job must provide at least $${MINIMAL_COMPENSATION} in compensation.\n
3. You can only post a job once every ${
    Number.parseInt(POST_LIMITER_IN_HOURS, 10) === 1
      ? 'hour'
      : `${POST_LIMITER_IN_HOURS} hours`
  }.\n
4. You agree not to abuse our job posting service or circumvent any server rules, and you understand that doing so will result in a ban.\n
`,
  'md'
)}
To continue, have the following information available:
${createMarkdownCodeBlock(
  `
1. Job location information (optional).\n
2. A short description of the job posting with no special formatting (at least ${MINIMAL_AMOUNT_OF_WORDS} words long).\n
3. The amount of compensation in USD for the job.\n
4. Contact information for potential job seekers to apply for your job.\n
`,
  'md'
)}
If your compensation is deemed unfair by the moderation team, your job posting will be removed.
If you agree to these guidelines, type ${'`ok`'}. If not, or you want to exit the form explicitly at any time, type ${'`cancel`'}.`;

const calcNextPostingThreshold = (diff: number) => {
  if (diff === 0) {
    return 'in a bit';
  }

  return diff === 1 ? 'in an hour' : `in ${diff} hours`;
};

const handleJobPostingRequest = async (msg: Message) => {
  const { guild, id: msgID } = msg;
  const { username, discriminator, id } = msg.author;
  const { type: msgChannelType } = msg.channel;

  const filter: CollectorFilter = m => m.author.id === msg.author.id;
  const send = (str: string) => msg.author.send(str);

  try {
    // Bail if the user is pinging the bot directly
    if (msgChannelType === 'dm') return;

    // Generate cache entry
    const entry = generateCacheEntry(id);
    // Check if the user has been cached
    const isCached = cache.get(entry.key);

    if (isCached) {
      const diff =
        Number.parseInt(POST_LIMITER_IN_HOURS) -
        Math.abs(new Date().getTime() - entry.value.getTime()) / 3600000;
      send(
        `You cannot create a job posting right now.\nPlease try again ${calcNextPostingThreshold(
          diff
        )}.`
      );
      return;
    }

    // Notify the user regarding the rules, and get the channel
    const { channel } = await send(greeterMessage);

    const { id: channelID } = msg.channel;
    const proceed = await getReply(channel, filter);

    if (!proceed) {
      return send('Canceled.');
    }

    const answers = await formAndValidateAnswers(channel, filter, guild, send, {
      discriminator,
      username,
    });

    // Just return if the iteration breaks due to invalid input
    if (!answers) {
      return;
    }

    const url = await createJobPost(answers, guild, channelID, {
      discriminator,
      msgID,
      userID: id,
      username,
    });

    // Notify the user that the form is now complete
    await send('Your job posting has been created!\n' + url);

    // Store the job post in the cache
    cache.set(entry.key, entry.value, POST_LIMITER);
  } catch (error) {
    await msg.reply(
      'Please temporarily enable direct messages as the bot cares about your privacy.'
    );
    // eslint-disable-next-line no-console
    console.error('post.handleJobPostingRequest', error);
  } finally {
    // Remove the message
    await msg.delete();
  }
};

export default handleJobPostingRequest;
