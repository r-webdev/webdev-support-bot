/* eslint-disable no-await-in-loop */
import type {
  Message,
  CollectorFilter,
  TextChannel,
  DMChannel,
  NewsChannel,
  Guild,
  GuildChannel,
  MessageEmbed,
  Client,
  Interaction,
} from 'discord.js';
import { filter } from 'domyno';

import { InteractionResponseType } from '../../../enums';
import type { CommandData } from '../../interactions';
import { registerCommand } from '../../interactions';
import { createInteractionResponse } from '../../interactions';
import { cache } from '../../spam_filter';
import { createEmbed, createMarkdownCodeBlock } from '../../utils/discordTools';
import { map } from '../../utils/map';
import { pipe } from '../../utils/pipe';
import { capitalize } from '../../utils/string';
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

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  weekday: 'long',
  day: '2-digit',
  year: 'numeric',
});

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

export type TargetChannel = {
  send?: (
    message: string | { embed: Partial<MessageEmbed> }
  ) => Promise<Message>;
} & GuildChannel;

const getCurrentDate = () => {
  return dateFormatter.format(Date.now());
};

/*
  The `capitalize` function does **not** capitalize only one word in a string.
  It capitalizes all words present in the string itself, separated with a space.
*/

const getTargetChannel = (guild: Guild, name: string): TargetChannel =>
  guild.channels.cache.find(({ name: n }) => n === name);

const generateURL = (guildID: string, channelID: string, msgID: string) =>
  `https://discordapp.com/channels/${guildID}/${channelID}/${msgID}`;

const getReply = async (
  channel: Channel,
  filter: CollectorFilter,
  timeMultiplier = 1
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

  const userTag = createUserTag(username, discriminator);

  try {
    targetChannel.send(
      createEmbed({
        description:
          'A user attempted creating a job post whilst providing invalid compensation.',
        fields: [
          {
            inline: true,
            name: 'User',
            value: userTag,
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
              `?ban ${userTag} Invalid compensation.`
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

const generateFields = pipe<Answers, Iterable<OutputField>>([
  filter(
    ([key, val]: [string, string]) =>
      key !== 'location' || val.toLowerCase() !== 'no'
  ),
  map(
    ([key, val]: [string, string]): OutputField => {
      let value = val;
      switch (key) {
        case 'compensation':
          value = val.includes('$') ? val : `${val}$`;
          break;
        case 'compensation_type':
        case 'remote':
          value = capitalize(val);
          break;
      }

      return {
        inline: false,
        name: capitalize(key.replace('_', ' ')),
        value,
      };
    }
  ),
]);

const createUserTag = (username: string, discriminator: string) =>
  `${username}#${discriminator}`;

const createJobPost = async (
  answers: Answers,
  guild: Guild,
  channelID: string,
  { username, discriminator, userID }: Metadata
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
  // const url = generateURL(guild.id, channelID, msgID);

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
        // url, doesn't seem to serve a purpose due to !post messages no longer existing and also never really used anyway
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
  for (const [key, val] of questions) {
    // Check if the current question is the location question
    if (key === 'location') {
      // Check if the `isRemote` value has been set to "yes"
      const isRemote = answers.get('remote').toLowerCase();
      // If the value is set to "yes", skip this iteration
      if (isRemote === 'yes') {
        continue;
      }
    }

    const q = val;
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
          sendAlert(guild, reply, { discriminator, username });
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

const handleJobPostingRequest = async (
  client: Client,
  interaction: Interaction
): Promise<void> => {
  const guild = await client.guilds.fetch(interaction.guild_id);
  const channel = guild.channels.resolve(interaction.channel_id);
  const member = await guild.members.fetch(interaction.member.user.id);
  const author = member.user;
  const { username, discriminator, id } = author;

  const filter: CollectorFilter = m => m.author.id === id;
  const send = (str: string) => author.send(str);

  try {
    // Generate cache entry
    const entry = generateCacheEntry(id);
    // Check if the user has been cached
    const isCached = cache.get(entry.key);

    if (isCached) {
      const diff =
        Number.parseInt(POST_LIMITER_IN_HOURS) -
        Math.abs(Date.now() - entry.value.getTime()) / 3_600_000;
      createInteractionResponse(client, interaction.guild_id, interaction, {
        data: {
          type: InteractionResponseType.ACKNOWLEDGE_WITH_SOURCE,
        },
      });
      send(
        `You cannot create a job posting right now.\nPlease try again ${calcNextPostingThreshold(
          diff
        )}.`
      );
      return;
    }

    createInteractionResponse(client, interaction.guild_id, interaction, {
      data: {
        type: InteractionResponseType.ACKNOWLEDGE_WITH_SOURCE,
      },
    });

    // Notify the user regarding the rules, and get the channel
    const { channel } = await send(greeterMessage);

    const { id: channelID } = channel;
    const proceed = await getReply(channel, filter);

    if (!proceed) {
      send('Canceled.');
      return;
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
      userID: id,
      username,
    });

    // Notify the user that the form is now complete
    await send(`Your job posting has been created!\n${url}`);

    // Store the job post in the cache
    cache.set(entry.key, entry.value, POST_LIMITER);
  } catch (error) {
    createInteractionResponse(client, interaction.guild_id, interaction, {
      data: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content:
            'Please temporarily enable direct messages as the bot cares about your privacy.',
        },
      },
    });
    // eslint-disable-next-line no-console
    console.error('post.handleJobPostingRequest', error);
  }
};

export default handleJobPostingRequest;

const jobPostCommand: CommandData = {
  name: 'post',
  description: 'Start the process of creating a new job post',
  handler: handleJobPostingRequest,
};

registerCommand(jobPostCommand);
