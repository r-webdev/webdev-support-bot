import { TextChannel, GuildChannel } from 'discord.js';
import { SpammerMetadata } from 'spam_filter';

import { createEmbed, createMarkdownBash } from '../utils/discordTools';

type ModChannel = TextChannel & Pick<GuildChannel, 'name'>;

export default async ({
  userID,
  username,
  discriminator,
  channelId,
  channelName,
  msgID,
  guild,
}: SpammerMetadata) => {
  const targetChannel = guild.channels.cache.find(
    ({ name }) => name === process.env.MOD_CHANNEL
  ) as ModChannel;

  if (!targetChannel) {
    console.warn(
      `channel ${process.env.MOD_CHANNEL} does not exist on this server`
    );
    return;
  }

  const url = `https://discordapp.com/channels/${guild.id}/${channelId}/${msgID}`;
  const user = `@${username}#${discriminator}`;

  try {
    await targetChannel.send(
      createEmbed({
        author: { name: userID },
        description: 'Spam has been detected on the server.',
        fields: [
          { inline: true, name: 'User', value: user },
          {
            inline: true,
            name: 'Channel',
            value: channelName,
          },
          {
            inline: false,
            name: 'Command',
            value: createMarkdownBash(
              `?mute ${user} 5h Spamming in #${channelName}`
            ),
          },
          { inline: false, name: 'Message Link', value: url },
        ],
        footerText: 'Spam Filter',
        provider: 'spam',
        title: 'Alert!',
        url,
      })
    );
  } catch (error) {
    console.error(error);
  }
};
