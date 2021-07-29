import type { MessageEmbed, Client, EmbedField, CommandInteraction } from 'discord.js';
import type { GuildMember } from 'discord.js';

import { ApplicationCommandOptionType } from '../../../enums';
import type { CommandDataWithHandler } from '../../../types';
import {
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  HELPFUL_ROLE_ID,
  HELPFUL_ROLE_POINT_THRESHOLD,
} from '../../env';
import type { IUser } from '../../helpful_role';
import HelpfulRoleMember from '../../helpful_role/db_model';
import { createEmbed } from '../../utils/discordTools';
import { some } from '../../utils/some';

const HELPFUL_ROLE_POINT_THRESHOLD_NUM = Number.parseInt(
  HELPFUL_ROLE_POINT_THRESHOLD
);

const getPoints = async (userID: string, guild: string) => {
  const user: IUser = await HelpfulRoleMember.findOne({
    guild,
    user: userID,
  });

  return user?.points ?? 0;
};

const setPoints = async (
  guild: string,
  userId: string,
  amount: string | number
): Promise<[] | [number, number]> => {
  const points =
    typeof amount === 'number' ? amount : Number.parseInt(amount) ?? 0;

  if (Number.isNaN(points)) {
    return [];
  }

  const user: IUser = await HelpfulRoleMember.findOne({
    guild,
    user: userId,
  });
  if (user) {
    const oldPoints = user.points;
    const currPoints = points;
    user.points = points;
    await user.save();
    return [oldPoints, currPoints];
  }
  return [];
};

const isModOrAdmin = some(id => id === ADMIN_ROLE_ID || id === MOD_ROLE_ID);


async function handlePoints(
  client: Client,
  interaction: CommandInteraction
): Promise<void> {
  // const [interactionOption] = interaction.data.options;
  console.log(interaction.member.roles)

  // const isAdmin = isModOrAdmin(interaction.member.roles);
  // switch (interactionOption.name) {
  //   case 'get': {
  //     const userId: string =
  //       (isAdmin && interactionOption?.options[0].options[0].value) ||
  //       interaction.member.user.id;

  //     const userName: string =
  //       getNameFromInteraction(
  //         interaction,
  //         interactionOption?.options?.[0].value
  //       ) ?? (await getMemberFromInteraction(client, interaction)).displayName;

  //     await handlePointsGet(userId, interaction, userName, isAdmin);
  //     return;
  //   }
  //   case 'set': {
  //     if (!isAdmin) {
  //       interaction.reply({
  //         content: 'You do not have permission to use this command',
  //         flags: 64,
  //       });
  //       return;
  //     }
  //     const user: string = interactionOption.options[0].value;
  //     const points: number = interactionOption.options[1].value;

  //     await handlePointsSet(client, interaction, user, points);
  //     return;
  //   }
  //   case 'reset': {
  //     if (!isAdmin) {
  //       interaction.reply({
  //         content: 'You do not have permission to use this command',
  //         flags: 64,
  //       });
  //       return;
  //     }
  //     const user = interactionOption.options[0].value;

  //     await handlePointsReset(interaction, user, client);

  //     return;
  //   }
  //   default:
  //     console.log(interaction.data.options);
  //     break;
  // }
  // interaction.acknowledge();
}

async function handlePointsGet(
  userId: string,
  interaction: CommandInteraction,
  userName: string,
  isAdmin: boolean
) {
  const points = await getPoints(userId, interaction.guildId);

  if (!userId && isAdmin) {
    interaction.reply({
      embeds: [createPointCheckEmbed(userName, `The provided user ID is invalid.`)]
    });
  }

  interaction.reply({
    embeds: [
    createPointCheckEmbed(
      userName,
      `${isAdmin ? 'The user has' : 'You have'} accumulated ${points} point${
        points === 1 ? '' : 's'
      }.`,
      isAdmin ? undefined : 'Helpful User Points'
    )]
  });
}

async function handlePointsReset(
  interaction: CommandInteraction,
  user: string,
  client: Client
) {
  const result = await setPoints(interaction.guildId, user, 0);
  const {member} = interaction

  if (result.length === 0) {
    interaction.reply({
      embeds: [
        createPointsEmbed(
          `The provided ID: "${user}" is not bound to any user.`,
          [adminEmbedField(interaction, true)]
        )
      ]
    });
    return;
  }

  // await member.roles.remove(HELPFUL_ROLE_ID);

  const embed = createPointsEmbed(`<@!${user}>'s points have been reset.`, [
    adminEmbedField(interaction, true),
  ]);

  interaction.reply({embeds:[embed]});
}

function adminEmbedField(interaction: CommandInteraction, inline = false): EmbedField {
  return {
    inline,
    name: 'Admin/Moderator',
    value: `<@!${interaction.member.user.id}>`,
  };
}

async function handlePointsSet(
  client: Client,
  interaction: CommandInteraction,
  user: string,
  points: number
) {
  const {member} = interaction

  if (!member) {
    interaction.reply({
      content: `User was invalid. (Not sure how that happened)`,
      ephemeral: true
    });
    return;
  }

  const result = await setPoints(interaction.guildId, user, points);

  if (result.length === 0) {
    interaction.reply({
      content:
        'Invalid argument provided for the points parameter.\nUsage example: ```' +
        '!points set @user 10' +
        '```',
      ephemeral: true
    });
    return;
  }

  const [prev, curr] = result;
  const output = createPointsEmbed(`Points have been set manually for a user`, [
    {
      inline: false,
      name: 'User',
      value: `<@!${user}>`,
    },
    adminEmbedField(interaction),
  ]);

  if (
    prev >= HELPFUL_ROLE_POINT_THRESHOLD_NUM &&
    curr < HELPFUL_ROLE_POINT_THRESHOLD_NUM
  ) {
    output.fields.push({
      inline: false,
      name: '⚠ Role Change',
      value: '❌ Helpful Revoked',
    });
  } else if (
    prev < HELPFUL_ROLE_POINT_THRESHOLD_NUM &&
    curr > HELPFUL_ROLE_POINT_THRESHOLD_NUM
  ) {
    output.fields.push({
      inline: false,
      name: '⚠ Role Change',
      value: '✅ Helpful Granted',
    });
  }

  interaction.reply({embeds:[output]});
}

function createPointCheckEmbed(
  userName: string,
  description: string,
  footerText = 'Admin: Points Handler'
): MessageEmbed {
  return createEmbed({
    description,
    footerText,
    provider: 'spam',
    title: `Points check for ${userName}`,
  }).embed ;
}

function createPointsEmbed(
  description: string,
  fields: EmbedField[] = []
): MessageEmbed {
  return createEmbed({
    description,
    fields,
    footerText: 'Admin: Points Handler',
    provider: 'spam',
    title: 'Points Handler',
  }).embed ;
}


export const pointsHandlers: CommandDataWithHandler ={
  description: 'point commands',
  handler: handlePoints,
  name: 'points',
  options: [
    {
      name: 'get',
      description: 'Get points of a user',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'user',
          type: 'USER',
          description: 'The user to get points for (Mod/Admins only)',
        },
      ],
    },
    {
      name: 'set',
      description: 'Set points of user (Mod/Admin only)',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'user',
          type: 'USER',
          description: 'The user to set points for (Mod/Admins only)',
          required: true,
        },
        {
          name: 'value',
          type: 'INTEGER',
          description: 'Number of points to set the user to have',
          required: true,
        },
      ],
    },
    {
      name: 'reset',
      description: 'Set points of user (Mod/Admin only)',
      type: 'SUB_COMMAND',
      options: [
        {
          name: 'user',
          type: 'USER',
          description: 'The user to reset points for (Mod/Admins only)',
          required: true,
        },
      ],
    },
  ],
};
