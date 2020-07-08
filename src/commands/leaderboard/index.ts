import { Message } from 'discord.js';

import { IUser } from '../../helpful_role';
import HelpfulRoleMember from '../../helpful_role/db_model';
import { createEmbed } from '../../utils/discordTools';
import { OutputField } from '../post';

const handleLeaderboardRequest = async (msg: Message, limit = 10) => {
  try {
    const topUsers: IUser[] =
      limit > 0
        ? [
            ...(await HelpfulRoleMember.find({ guild: msg.guild.id })
              .sort({ points: -1 })
              .limit(limit)),
          ]
        : [];

    const fields: OutputField[] = topUsers.map(
      ({ user, points }, i): OutputField => {
        return {
          inline: false,
          name: `${i + 1}.`,
          value: `<@!${user}>: ${points} point${points === 1 ? '' : 's'}.`,
        };
      }
    );

    const output = createEmbed({
      description: `${
        fields.length > 0 ? 'Top helpful users:' : 'No users found.'
      }`,
      fields,
      footerText: 'Leaderboard: Helpful Users',
      provider: 'spam',
      title: 'Leaderboard: Helpful Users',
    });

    msg.channel.send(output);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('catch -> leaderboard/index.ts', error);
  }
};

export default handleLeaderboardRequest;
