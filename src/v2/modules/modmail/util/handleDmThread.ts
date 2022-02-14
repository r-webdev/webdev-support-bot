import type { Message} from 'discord.js';
import { MessageEmbed } from 'discord.js';

import { ModMailThread } from '../db/modmail_thread';
import { getModMailThread } from './getModMailThread';

export const handleDmThread = async (msg: Message) => {
  const modmailThreadData = await ModMailThread.findOne({
    userId: msg.author.id,
    guildId: msg.guildId,
    closedAt: { $exists: false },
  }).exec();

  if(!modmailThreadData) {
    return
  }

  const modmailThread = await getModMailThread(msg.guild, msg.author)

  if (msg.attachments.size === 0) {
    await modmailThread.send({
      embeds: [
        new MessageEmbed()
          .setColor(0xff_96_00)
          .setAuthor({
            name: `${msg.author.username}#${msg.author.discriminator}`,
            iconURL: msg.author.avatarURL(),
          })
          .setDescription(msg.content)
          .setTitle('Message Received')
          .setTimestamp(msg.createdTimestamp),
      ],
    });

    msg.react("✅")
  }
};
