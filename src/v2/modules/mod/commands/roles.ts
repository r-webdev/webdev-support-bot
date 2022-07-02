import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import { chunk } from 'domyno';
import { map } from '../../../utils/map';
import { pipe } from '../../../utils/pipe';
import { NOTIFY_ROLES } from '../../roles/consts/notifyRoles';
import { ROLES } from '../../roles/consts/roles';

const generateButtons = (roles: typeof ROLES | typeof NOTIFY_ROLES) =>
  roles.map(item =>
    new MessageButton()
      .setCustomId(`roles🤔toggle🤔${item.name}`)
      .setLabel(item.name)
      .setStyle('SECONDARY')
      .setEmoji(item.emoji)
  );
const chunkAndRowify = pipe<
  Iterable<MessageButton>,
  Iterable<MessageActionRow>
>([chunk(5), map(x => new MessageActionRow().addComponents(...x))]);

export async function setupRoles(interaction: CommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  interaction.channel.send({
    content: 'You will need embeds enabled to interact with several features in this server.',
    embeds: [
      new MessageEmbed().setTitle('Assign Yourself Roles Below')
      .setDescription(`Click on the reaction that corresponds with the role you're interested in.`)
      .setColor('GREEN'),
      new MessageEmbed()
      .setColor('GREEN')
      .setTitle('⭐ IMPORTANT: Access Role-Locked Channels')
      .setDescription('In order to see any general channel, you must have at least one role from the list below (excluding Community Announcement roles). If you would like access to a technology-specific channel, you must add that role to your profile. Add as many roles as you like.'),
      new MessageEmbed().setColor('YELLOW').setDescription(`:warning: Note: You can add and remove roles faster using the \`/roles change\` command`)
    ],
    components: [
      ...chunkAndRowify([
        ...generateButtons(ROLES),
        new MessageButton()
          .setCustomId('roles🤔toggle🤔All Development')
          .setLabel('All Channels')
          .setStyle('SECONDARY')
          .setEmoji('🤓'),
      ]),
    ],
  });

  await interaction.channel.send({
    content:
      'We also have some roles for if you wish to be notified about various optional announcements, which you can opt into here:',
    components: [
      ...chunkAndRowify(
        generateButtons(NOTIFY_ROLES)
      )
    ],
  });

  await interaction.editReply({
    content: 'Done.',
  });
}
