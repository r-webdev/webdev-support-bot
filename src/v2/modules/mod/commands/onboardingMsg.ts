import type { CommandInteraction } from 'discord.js';

export async function setupOnboardingMsg(
  interaction: CommandInteraction
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  interaction.channel.send({
    content: `
:wave: Hi! If you're in this channel then you should have been invited to a private thread to begin the onboarding. If not, please give it a moment as the bot might be down or busy.
    `,
  });

  await interaction.editReply({
    content: 'Done.',
  });
}
