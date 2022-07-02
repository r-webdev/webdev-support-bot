import type { Interaction, GuildMember } from 'discord.js';

import { UserState } from '../db/user_state';
import { continueOnboarding } from '../utils/continueOnboarding';
import { getThread } from '../utils/getThread';

export const handleSkipIntro = async (interaction:Interaction): Promise<void> => {
  if(!interaction.isButton()) {
    return
  }

  const [type, subtype] = interaction.customId.split('🤔')

  if(type !== 'onboarding' || subtype !== 'skip_intro') {
    return;
  }

    const oldState = await UserState.findOne({
      guild: interaction.guild.id,
      userId: interaction.user.id,
    })

    const thread = await getThread(interaction.guild, oldState.threadId)

    const pinned = await thread.messages.fetchPinned()
    const introMsg = pinned.last()

    try {

      await interaction.reply('No worries, you can always introduce yourself later')
    } catch(e) {
      console.error("fell over there")
    }

    try {

      await introMsg?.edit({
        components: []
      })
    }catch(e) {
      console.error("Fell over here")
    }

    oldState.state = 'ROLE_SELECTION'

    await Promise.all([oldState.save(),introMsg.unpin()])

    continueOnboarding(interaction.guild, interaction.member as GuildMember, oldState, false)
};
