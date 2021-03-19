import { Message, EmbedField } from 'discord.js';

import { TargetChannel, capitalize } from '../commands/post';
import {
  POINT_DECAY_TIMER,
  MOD_CHANNEL,
  IS_PROD,
  HELPFUL_ROLE_POINT_THRESHOLD,
  HELPFUL_ROLE_EXEMPT_ID,
  HELPFUL_ROLE_ID,
} from '../env';
import { createEmbed } from '../utils/discordTools';
import HelpfulRoleMember from './db_model';

import { IUser } from '.';

let lastDecay = Date.now();

export const decay = async (
  { guild, author: { id } }: Message,
  force = false
) => {
  try {
    const users: IUser[] = await HelpfulRoleMember.find({
      guild: guild.id,
      points: {
        $gt: 0,
      },
    });

    for (const user of users) {
      const currentPoints = user.points ?? 0;
      const decay = Math.ceil(currentPoints / 100);
      const nextPoints = currentPoints - decay;

      user.points = nextPoints > 0 ? nextPoints : 0;

      await user.save();

      const member = guild.members.cache.get(user.user);

      if (
        user.points < Number.parseInt(HELPFUL_ROLE_POINT_THRESHOLD) &&
        !member?.roles.cache.has(HELPFUL_ROLE_EXEMPT_ID)
      ) {
        member?.roles.remove(HELPFUL_ROLE_ID);
      }
    }

    const modChannel: TargetChannel = guild.channels.cache.find(
      c => c.name === MOD_CHANNEL
    );

    const fields: EmbedField[] = [
      {
        inline: false,
        name: 'Forced?',
        value: capitalize(`${force}`),
      },
      force && {
        inline: false,
        name: 'Admin/Moderator',
        value: `<@!${id}>`,
      },
    ].filter(Boolean);

    await modChannel.send(
      createEmbed({
        description: `The point decay affected ${users.length} user${
          users.length === 1 ? '' : 's'
        }.`,
        fields,
        footerText: 'Point Decay System',
        provider: 'spam',
        title: 'Point Decay Alert',
      })
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('catch -> decay(msg):', error);
  }
};

export const getTimeDiffToDecay = () => {
  const timestamp = Date.now();

  return {
    diff: (timestamp - lastDecay) / (1000 * 3600),
    timestamp,
  };
};

const pointDecaySystem = async (msg: Message) => {
  const { diff, timestamp } = getTimeDiffToDecay();
  const timer = IS_PROD ? Number.parseInt(POINT_DECAY_TIMER) : 0.005;

  if (diff >= timer) {
    lastDecay = timestamp;

    await decay(msg);
  }
};

export default pointDecaySystem;
