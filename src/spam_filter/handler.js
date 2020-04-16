const { createEmbed, createMarkdownBash } = require('../utils/discordTools');

/**
 * @param {import('discord.js').Message} msg
 */
module.exports = async ({
  userID,
  username,
  discriminator,
  channel,
  msgID,
  server,
}) => {
  /**
   * @param {import('discord.js').Channel} modChannel
   */
  const modChannel = server.channels.cache.find(
    ({ name }) => name === process.env.MOD_CHANNEL
  );

  if (!modChannel) {
    console.warn(`channel ${modChannel} does not exist on this server`);
    return;
  }

  const url = `https://discordapp.com/channels/${server.id}/${channel.id}/${msgID}`;
  const user = `@${username}#${discriminator}`;

  try {
    await modChannel.send(
      createEmbed({
        provider: 'spam',
        description: 'Spam has been detected on the server.',
        author: userID,
        url,
        title: 'Alert!',
        fields: [
          { name: 'User', value: user, inline: true },
          { name: 'Channel', value: channel, inline: true },
          {
            name: 'Command',
            value: createMarkdownBash(
              `?mute ${user} 5h Spamming in #${channel.name}`
            ),
          },
          { name: 'Message Link', value: url },
        ],
        footerText: 'Spam Filter',
      })
    );
  } catch (error) {
    console.error(error);
  }
};
