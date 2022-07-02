import type {Message} from 'discord.js'

export const sneakPin = async (msg: Message): Promise<void> => {
  const awaitedPinned = msg.channel.awaitMessages({
    filter: x => x.type === 'CHANNEL_PINNED_MESSAGE',
    max: 1
  })

  await msg.pin()

  const pinned = await awaitedPinned
  await pinned.first().delete()
}
