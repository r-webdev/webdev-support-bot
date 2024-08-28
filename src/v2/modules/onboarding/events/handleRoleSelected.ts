import { ActionRowBuilder, ComponentType, MessageActionRowComponentBuilder, type GuildMember, type Interaction, type Message, StringSelectMenuBuilder } from 'discord.js';

import { UserState } from '../db/user_state.js';
import { continueOnboarding } from '../utils/continueOnboarding.js';

export const handleRoleSelected = async (
  interaction: Interaction
): Promise<void> => {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) {
    return;
  }

  const [type, subType, name] = interaction.customId.split('🤔');
  if (type !== 'onboarding' || subType !== 'roles') {
    return;
  }

  const message = interaction.message as Message;
  const member = interaction.member as GuildMember;
  const picked = new Set(interaction.isButton() ? [name] : interaction?.values);

  const { guild, user } = interaction;
  const pickedRoles = guild.roles.cache.filter(
    x => picked.has(x.name) || x.name === 'All Development'
  );

  await member.roles.add(pickedRoles);

  const oldState = await UserState.findOne({
    guild: guild.id,
    userId: user.id,
  });

  const msg = interaction.message as Message;

  await interaction.reply({
    content: `I've given you the roles to give you access the channels for ${new Intl.ListFormat().format(
      [...pickedRoles.values()].map(x => x.name)
    )}`,
  });

  await msg.edit({
    components: msg.components.map(x => {
      if (x.type === ComponentType.ActionRow) {
        return new ActionRowBuilder<MessageActionRowComponentBuilder>(x).setComponents(x.components.map(x => {
          if (x.type === ComponentType.StringSelect) {
            return new StringSelectMenuBuilder(x).setDisabled(true)
          }
          return x as unknown as MessageActionRowComponentBuilder
        }))
      }
      return x;
    }),
  });

  if (oldState.state !== 'ONBOARDED') {
    oldState.state = 'ONBOARDED';
    await oldState.save();

    await message.unpin();

    continueOnboarding(guild, member, oldState);
  }
};
