const { createEmbed, createMarkdownBash } = require('../utils/discordTools');

module.exports = ({
  userID,
  username,
  discriminator,
  channel,
  msgID,
  server,
}) => {
  const modChannel = server.channels.cache.find(
    (c) => c.name === process.env.MOD_CHANNEL,
  );
  const { id: serverID } = server;
  const url = `https://discordapp.com/channels/${serverID}/${channel.id}/${msgID}`;
  const user = `@${username}#${discriminator}`;
  modChannel.send(
    createEmbed({
      provider: 'spam',
      description: 'Spam has been detected on the server.',
      author: userID,
      url,
      title: 'Alert!',
      fields: [
        { name: 'User', value: user, inline: true },
        { name: 'Channel', value: `${channel}`, inline: true },
        {
          name: 'Command',
          value: createMarkdownBash(
            `?mute ${user} 5h Spamming in #${channel.name}`,
          ),
        },
        { name: 'Message Link', value: url },
      ],
      footerText: 'Spam Filter',
    }),
  );
};
