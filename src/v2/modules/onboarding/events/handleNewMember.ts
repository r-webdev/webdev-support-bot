import type { GuildMember, Guild, TextChannel } from 'discord.js';
import { MessageEmbed, MessageActionRow, MessageButton } from 'discord.js';

import { NEW_USER_ROLE, ONBOARDING_CHANNEL, SERVER_ID } from '../../../env';
import { rules } from '../consts/rules';
import { UserState } from '../db/user_state';
import { continueOnboarding } from '../utils/continueOnboarding';
import { sneakPin } from '../utils/sneakPin';


export const handleNewMember = async (member: GuildMember): Promise<void> => {
  const { guild, user, roles } = member;

  const oldState = await UserState.findOne({
    guild: SERVER_ID,
    userId: user.id,
  });

  if(oldState?.rolesOnLeave) {
    const guildRoles = await guild.roles.fetch()
    const ids = new Set(oldState.rolesOnLeave.map(({id}) => id))
    const names = new Set(oldState.rolesOnLeave.map(({name}) => name))
    member.roles.set(guildRoles.filter(x=> names.has(x.name) || ids.has(x.id)))
  }

  if (oldState?.state === 'ONBOARDED') {
    return; // Don't reonboard people who have been onboarded
  }

  await roles.add(NEW_USER_ROLE);

  if (!oldState) {
    await beginOnboarding(guild, member);
    return;
  }

  await continueOnboarding(guild, member, oldState, true);

  // False Positive
  // eslint-disable-next-line no-promise-executor-return
  await new Promise<void>(resolve => setTimeout(resolve, 10_000));
};

async function beginOnboarding(guild: Guild, member: GuildMember) {
  const onboardingChannel = guild.channels.resolve(
    ONBOARDING_CHANNEL
  ) as TextChannel;

  const thread = await onboardingChannel.threads.create({
    name: `Hi ${member.displayName}! 👋`,
    type: 'GUILD_PUBLIC_THREAD',
    autoArchiveDuration: 60,
    reason: `Onboarding ${member}`,
  });

  const state = await UserState.create({
    guild: guild.id,
    userId: member.user.id,
    state: 'START',
    threadId: thread.id,
  });
  await thread.send(
    `Hi ${member}, welcome to ${guild.name}! Before you can get access to the rest of the server, we just need to go over a few things.

First, to be able to interact with several of the features of this server, you **will** need embeds enabled.
Second:`
  );

  const rulesMsg = await thread.send({
    embeds: [
      new MessageEmbed()
        .setTitle('📋 Our Community rules')
        .setColor('GOLD')
        .addFields(
          rules.map((x, i) => ({
            name: `${i + 1}. ${x.title}`,
            value: x.description,
          }))
        ),
    ],
    components: [
      new MessageActionRow().addComponents([
        new MessageButton()
          .setStyle('SECONDARY')
          .setLabel('Just giving you a bit of time to read the rules...')
          .setEmoji('⏲')
          .setCustomId('onboarding🤔rules_agreed')
          .setDisabled(true),
      ]),
    ],
  });

  await sneakPin(rulesMsg);
  await continueOnboarding(guild, member, state, false);
}
