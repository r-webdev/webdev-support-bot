import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
} from 'discord.js';

export async function suggest(interaction: CommandInteraction) {
  await interaction.deferReply({
  });
  const user = interaction.options.getUser('user');
  const role = interaction.options.getString('role', true);

  interaction.editReply({
    content: `Hey${user ? ` ${user}` : ''}, ${
      interaction.member
    } is suggesting that you join the ${role} role.`,
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
