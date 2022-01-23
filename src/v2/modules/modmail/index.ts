import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';

import { SERVER_ID } from '../../env.js';
import { isLocked } from '../../utils/dmLock.js';
import { createInitialEmbed, createUserEmbed } from './util/embeds.js';
import { getModMailThreadOrCreate } from "./util/getModMailThreadOrCreate";

export * from './commands/index.js';

export const handleDM = async (msg: Message): Promise<void> => {
  if (await isLocked(SERVER_ID, msg.author.id)) {
    return
  }
  const guild = msg.client.guilds.cache.get(SERVER_ID);
  const { thread, existing } = await getModMailThreadOrCreate(
    guild,
    msg.author
  );

  if (!existing) {
    const member = await guild.members.fetch(msg.author);

    if (member) {
      await thread.send({
        embeds: [createInitialEmbed(), createUserEmbed(member)],
      });
    } else {
      await thread.send({
        embeds: [createInitialEmbed()],
      });
    }
  }

  if (msg.attachments.size === 0) {
    await thread.send({
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
