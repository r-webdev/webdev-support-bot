import { SpammerMetadata } from 'spam_filter';
import { createEmbed, createMarkdownBash } from '../utils/discordTools';
import { TextChannel, GuildChannel } from 'discord.js';

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
        provider: 'spam',
        description: 'Spam has been detected on the server.',
        author: { name: userID },
        url,
        title: 'Alert!',
        fields: [
          { name: 'User', value: user, inline: true },
          {
            name: 'Channel',
            value: channelName,
            inline: true,
          },
          {
            name: 'Command',
            value: createMarkdownBash(
              `?mute ${user} 5h Spamming in #${channelName}`
            ),
            inline: false,
          },
          { name: 'Message Link', value: url, inline: false },
        ],
        footerText: 'Spam Filter',
      })
    );
  } catch (error) {
    console.error(error);
  }
};
