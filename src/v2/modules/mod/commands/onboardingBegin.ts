import { CommandInteraction, MessageInteraction } from "discord.js";
import { NEW_USER_ROLE,ONBOARDING_CHANNEL,JOIN_LOG_CHANNEL,INTRO_CHANNEL,INTRO_ROLE } from '../../../env.js'
import {setOnboardingStart} from '../../onboarding/utils/onboardingStart'
import {attach} from '../../onboarding/index'

export async function beginOnboarding (interaction: CommandInteraction) {
  interaction.reply({
    content: `
      DEBUG:
      New User Role: <@&${NEW_USER_ROLE}>
      Onboarding Channel: <#${ONBOARDING_CHANNEL}>
      Join Log Channel: <#${JOIN_LOG_CHANNEL}>
      Intro Channel: <#${INTRO_CHANNEL}>
      New User Role: <@&${INTRO_ROLE}>
    `
  })

  const foo = await setOnboardingStart()

  await attach(interaction.client)
}
