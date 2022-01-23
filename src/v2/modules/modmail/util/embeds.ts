import type { EmbedField, GuildMember, GuildMemberRoleManager } from 'discord.js';
import { MessageEmbed } from 'discord.js';


export function createInitialEmbed(): MessageEmbed {
  return new MessageEmbed().setTitle('New Ticket')
    .setDescription(`You can type in this thread without messages being sent into the user. Please use this thread to also paste any evidence that relates to the case.

To send a message to the user please use the \`/send\` command.`);
}

function rolesList(roles: GuildMemberRoleManager | string[]) {
  if (Array.isArray(roles)) {
    return roles.map(x => `<@&${x}>`).join(', ');
  }
  return roles.cache
    .filter(x => x.name !== '@everyone')
    .map(x => x)
    .join(', ');
}


export function createReporterEmbed(member: GuildMember): MessageEmbed {
  return new MessageEmbed()
    .setTitle('Reporter')
    .setDescription('Below is information regarding the reporter')
    .setColor(5_283_840)
    .setAuthor({
      name: `${member.user.username}#${member.user.discriminator}`,
      iconURL: member.user.avatarURL(),
    })
    .setThumbnail(member.user.avatarURL())
    .addFields(createUserFields(member));
}
export function createReporteeEmbed(member: GuildMember) : MessageEmbed{
  return new MessageEmbed()
    .setTitle('Reportee')
    .setDescription(
      'Below is information regarding the user that has been reported'
    )
    .setColor(16_750_080)
    .setAuthor({
      name: `${member.user.username}#${member.user.discriminator}`,
      iconURL: member.user.avatarURL(),
    })
    .setThumbnail(member.user.avatarURL())
    .addFields(createUserFields(member));
}

export function createUserEmbed(member: GuildMember): MessageEmbed {
  return new MessageEmbed()
    .setTitle('User Info')
    .setDescription(
      'Information about the user'
    )
    .setColor(16_750_080)
    .setAuthor({
      name: `${member.user.username}#${member.user.discriminator}`,
      iconURL: member.user.avatarURL(),
    })
    .setThumbnail(member.user.avatarURL())
    .addFields(createUserFields(member));
}

function createUserFields(member: GuildMember): EmbedField[] {
  return [
    {
      name: 'Name',
      // toString has been overridden for users
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      value: `${member.user} (${member.user.id})`,
      inline: false,
    },
    {
      name: 'Registered',
      value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}>`,
      inline: true,
    },
    {
      name: 'Joined',
      value: `<t:${Math.floor(member.joinedTimestamp / 1000)}>`,
      inline: true,
    },
    {
      name: `Roles (${rolesCount(member.roles)})`,
      value: `${rolesList(member.roles)}`,
      inline: false,
    },
  ];
}

function rolesCount(roles: GuildMemberRoleManager | string[]) {
  return Array.isArray(roles)
    ? roles.filter(item => item !== '@everyone').length
    : roles.cache.filter(role => role.name !== '@everyone').size;
}
