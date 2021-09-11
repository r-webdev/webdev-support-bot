/* eslint-disable no-await-in-loop */
import type {
  Message,
  CollectorFilter,
  TextChannel,
  DMChannel,
  NewsChannel,
  Guild,
  Client,
  ThreadChannel,
  CommandInteraction,
  User} from 'discord.js';
import {
  GuildChannel,
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} from 'discord.js';
import { filter } from 'domyno';

import type { CommandDataWithHandler } from '../../../types';
import { cache } from '../../spam_filter';
import { MultistepForm } from '../../utils/MultistepForm';
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
import {questions} from './questions.v2';

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

const getCurrentDate = () => {
  return dateFormatter.format(Date.now());
};

/*
  The `capitalize` function does **not** capitalize only one word in a string.
  It capitalizes all words present in the string itself, separated with a space.
*/

const getTargetChannel = (
  guild: Guild,
  name: string
): TextChannel | ThreadChannel =>
  guild.channels.cache.find(({ name: n }) => n === name) as TextChannel | ThreadChannel;

const generateURL = (guildID: string, channelID: string, msgID: string) =>
  `https://discordapp.com/channels/${guildID}/${channelID}/${msgID}`;

const getReply = async (
  channel: DMChannel,
  filter: CollectorFilter<[Message]>,
  timeMultiplier = 1
) => {
  try {
    const res = await channel.awaitMessages({
      filter,
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
    targetChannel.send({
      embeds: [
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
        }).embed,
      ],
    });
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
  const targetChannel = getTargetChannel(guild, 'job-postt');

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
    const msg = await targetChannel.send({
      embeds: [
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
        }).embed
      ]}
    );

    return generateURL(guild.id, msg.channel.id, msg.id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('post.createJobPost', error);
  }
};

// const formAndValidateAnswers = async (
//   channel: Channel,
//   filter: CollectorFilter<[Message]>,
//   guild: Guild,
//   send: Function,
//   { username, discriminator }: Metadata
// ): Promise<Answers> => {
//   const answers = new Map();

//   // Iterate over questions
//   for (const [key, val] of questions) {
//     // Check if the current question is the location question
//     if (key === 'location') {
//       // Check if the `isRemote` value has been set to "yes"
//       const isRemote = answers.get('remote').toLowerCase();
//       // If the value is set to "yes", skip this iteration
//       if (isRemote === 'yes') {
//         continue;
//       }
//     }

//     const q = val;
//     // Send out the question
//     await send(q.body);
//     // Await the input
//     const reply = await getReply(
//       channel as DMChannel,
//       filter,
//       // Increase the timeout up to 5x of `AWAIT_TIMEOUT` when waiting for the job description
//       key === 'description' ? 5 : 1
//     );

//     // If the reply is equal to "cancel" (aka, returns false), cancel the form
//     if (!reply) {
//       await send('Explicitly cancelled job post form. Exiting.');
//       return;
//     }

//     // If there is a validation method appended to the question, use it
//     if (!q.validate) {
//       answers.set(key, reply);
//       continue;
//     }

//     // If the input is not valid, cancel the form and notify the user.
//     const isValid = q.validate(reply.toLowerCase());

//     if (!isValid) {
//       switch (key) {
//         case 'compensation':
//           // Alert the moderators if the compensation is invalid.
//           sendAlert(guild, reply, { discriminator, username });
//           break;
//         case 'description':
//           await send(
//             `The job description should contain more than ${MINIMAL_AMOUNT_OF_WORDS} words.`
//           );
//           break;
//       }
//       await send('Invalid input. Cancelling form.');
//       return;
//     }

//     // Otherwise, store the answer in the output map
//     answers.set(key, reply);
//   }

//   return answers;
// };

const generateCacheEntry = (key: string): CacheEntry => ({
  key: `jp-${key}`, // JP stands for Job Posting, for the sake of key differentiation
  value: new Date(),
});



const calcNextPostingThreshold = (diff: number) => {
  if (diff === 0) {
    return 'in a bit';
  }

  return diff === 1 ? 'in an hour' : `in ${diff} hours`;
};

const handleJobPostingRequest = async (
  client: Client,
  interaction: CommandInteraction
): Promise<void> => {
  const { guild } = interaction;
  const author = interaction.member.user as User;
  const { username, discriminator, id } = author;

  const filter: CollectorFilter<[Message]> = m => m.author.id === id;
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
      interaction.deferReply();

      send(
        `You cannot create a job posting right now.\nPlease try again ${calcNextPostingThreshold(
          diff
        )}.`
      );
      return;
    }



    await interaction.reply({ content: `I've DMed you to start the process.`, ephemeral: true});

    // Notify the user regarding the rules, and get the channel
    const channel = await author.createDM();
    console.log(channel)

    const { id: channelID } = channel;
    // const proceed = await getReply(channel, filter);

    // if (!proceed) {
    //   send('Canceled.');
    //   return;
    // }

    const form = new MultistepForm(questions, channel, author)

    const answers = await form.getResult('guidelines') as unknown as Answers
    console.log({answers})
    // const answers = await formAndValidateAnswers(channel, filter, guild, send, {
    //   discriminator,
    //   username,
    // });

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
    interaction.reply(
      'Please temporarily enable direct messages as the bot cares about your privacy.'
    );
    // eslint-disable-next-line no-console
    console.error('post.handleJobPostingRequest', error);
  }
};

export const jobPostCommand: CommandDataWithHandler = {
  name: 'post',
  description: 'Start the process of creating a new job post',
  handler: handleJobPostingRequest,
};
