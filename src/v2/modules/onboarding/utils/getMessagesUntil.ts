import { Message, TextChannel } from "discord.js";
import { filter } from "domyno";

export async function* getMessagesUntil (channel: TextChannel, date: Date, limit = 100): AsyncIterableIterator<Message> {
  let before
  const timestamp = date.getTime()

  const msgAfter = filter<Message>((msg:Message) => msg.createdTimestamp > timestamp)

  while (true) {
    const messages = await channel.messages.fetch({ limit, before })
    if(messages.size === 0) return
    yield* msgAfter(messages.values())
    before = messages.last().id
  }

}
