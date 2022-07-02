import type { Guild, GuildMember, Interaction, Message } from 'discord.js';
import { MessageActionRow, MessageButton } from 'discord.js';
import { SERVER_ID } from '../../../env';

import { UserState } from '../db/user_state';
import { continueOnboarding } from '../utils/continueOnboarding';

export const handleNotifyRolesSelected = async (
  interaction: Interaction
): Promise<void> => {
  if (!interaction.isSelectMenu()) {
    return;
  }

  const [type, subType] = interaction.customId.split('🤔');
  if (type !== 'onboarding' || subType !== 'notify_roles') {
    return;
  }

  const message = interaction.message as Message;
  const member = interaction.member as GuildMember;
  const picked = new Set(interaction.values);

  const { guild, user } = interaction;

  const pickedRoles = guild.roles.cache.filter(x => picked.has(x.name));

  member.roles.add(pickedRoles);
  interaction.reply({
    content: `:loudspeaker: I've given you the roles to notify you about ${new Intl.ListFormat().format(
      [...pickedRoles.values()].map(x => x.name)
    )}`,
  });
  const msg = interaction.message as Message;

  msg.edit({
    components: msg.components.map(x => {
      x.components[0].disabled = true
      return x
    })
  })

  const oldState = await UserState.findOne({
    guild: guild.id,
    userId: user.id,
  });

  if (oldState.state !== 'ONBOARDED') {
    oldState.state = 'ONBOARDED';
    await oldState.save();

    await message.unpin();

    continueOnboarding(guild, member, oldState);
  }
};
