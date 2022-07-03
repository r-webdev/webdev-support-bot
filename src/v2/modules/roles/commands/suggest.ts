import type { CommandInteraction, GuildMember } from 'discord.js';
import { MessageActionRow, MessageButton } from 'discord.js';

export async function suggest(interaction: CommandInteraction): Promise<void> {
  await interaction.deferReply({});

  const member = interaction.member as GuildMember;
  const user = interaction.options.getUser('user');
  const role = interaction.options.getString('role', true);

  interaction.editReply({
    content: `Hey${
      user ? ` ${user}` : ''
    }, ${member.toString()} is suggesting that you join the ${role} role.`,
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel(`Join ${role} Role`)
          .setCustomId(`roles🤔add🤔${role}`)
          .setStyle('PRIMARY')
      ),
    ],
  });
}
