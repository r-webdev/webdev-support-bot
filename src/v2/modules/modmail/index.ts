import type { Client, Message} from 'discord.js';
import { MessageEmbed } from 'discord.js';

import { SERVER_ID } from '../../env.js';
import {
  getModMailThreadOrCreate,
} from './util/createModMailThread.js';

export * from './commands/index.js';

export const handleDM =  async (msg:Message): Promise<void> => {
    const guild = msg.client.guilds.cache.get(SERVER_ID);
    const thread = await getModMailThreadOrCreate(guild, msg.author);

    if(msg.attachments.size === 0) {
      thread.send({
        embeds: [
          new MessageEmbed()
          .setColor(0xff_96_00)
          .setAuthor({
            name: `${msg.author.username}#${msg.author.discriminator}`,
            iconURL: msg.author.avatarURL(),
          })
          .setDescription(msg.content)
          .setTitle('Message Received')
          .setTimestamp(msg.createdTimestamp)
        ],
      });
    }
  };
