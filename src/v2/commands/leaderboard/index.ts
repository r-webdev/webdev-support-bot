import type { CommandInteraction, Client } from 'discord.js';

import type { CommandDataWithHandler } from '../../../types';
import type { IUser } from '../../helpful_role';
import HelpfulRoleMember from '../../helpful_role/db_model';
import { createEmbed } from '../../utils/discordTools';
import type { OutputField } from '../post';

const LIMIT = 20

const handleLeaderboardRequest = async (client:Client, interaction:CommandInteraction): Promise<void> => {
  try {
    const topUsers: IUser[] =
      LIMIT > 0
        ? [
            ...(await HelpfulRoleMember.find({ guild: interaction.guild.id })
              .sort({ points: -1 })
              .limit(LIMIT)),
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

    interaction.reply({
      embeds: [output.embed]
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('catch -> leaderboard/index.ts', error);
  }
};

export const leaderboardCommand: CommandDataWithHandler = {
  name: 'leaderboard',
  description: `Display the points leaderboard, showing the top ${LIMIT} users`,
  handler: handleLeaderboardRequest
};
