import { Message } from 'discord.js';

import { TargetChannel } from '../commands/post';
import { POINT_DECAY_TIMER, MOD_CHANNEL, IS_PROD } from '../env';
import { createEmbed } from '../utils/discordTools';
import HelpfulRoleMember from './db_model';

import { IUser } from '.';

let lastCleanup = Date.now();

const cleanup = async ({ guild, author: { bot } }: Message) => {
  try {
    if (bot) return;

    const users: IUser[] = await HelpfulRoleMember.find({
      guild: guild.id,
      points: {
        $gt: 0,
      },
    });

    users.forEach(async user => {
      user.points--;
      await user.save();
    });

    const modChannel: TargetChannel = guild.channels.cache.find(
      c => c.name === MOD_CHANNEL
    );
    await modChannel.send(
      createEmbed({
        description: `The point decay affected ${users.length} user${
          users.length === 1 ? '' : 's'
        }.`,
        footerText: 'Point Decay System',
        provider: 'spam',
        title: 'Point Decay Alert',
      })
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('catch -> cleanup():', error);
  }
};

const pointDecaySystem = async (msg: Message) => {
  const now = Date.now();
  const diff = (now - lastCleanup) / (1000 * 3600);
  const timer = IS_PROD ? Number.parseInt(POINT_DECAY_TIMER) : 0.01;

  if (diff >= timer) {
    lastCleanup = now;

    await cleanup(msg);
  }
};

export default pointDecaySystem;
