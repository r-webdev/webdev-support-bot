import type {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Interaction,
  Message,
  SelectMenuInteraction,
  ThreadChannel} from 'discord.js';
import {
  MessageActionRow,
  MessageButton,
  Collection,
  MessageSelectMenu
} from 'discord.js';
import { asyncCatch } from '../../utils/asyncCatch';
import { createResponse } from './createResponse';

export async function handleThreadThanks(msg: Message): Promise<void> {
  const {channel} = msg
  if(!channel.isThread()){return}

  const members = channel.guildMembers

  const msgs = await channel.messages.fetch()
  const foo = await channel.members.fetch(false)

  const otherMembers = foo.filter(
    x => x.user.id !== msg.author.id && !x.user.bot
  );

  if(otherMembers.size === 0) {
    return
  }

  msg.reply({
    content:
      "Hey, it looks like you're trying to thank one or many users, but haven't specified who. Who would you like to thank?",
    components: [
      new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .addOptions(
            otherMembers.map(item => ({
              label: item.guildMember.displayName,
              value: item.user.id,
              description: `${item.user.username}#${item.user.discriminator}`,
            }))
          )
          .setMinValues(1)
          .setCustomId(`threadThanks🤔${msg.id}🤔select🤔${msg.author.id}`)
      ),
      new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Nevermind")
          .setStyle('DANGER')
          .setCustomId(`threadThanks🤔${msg.id}🤔cancel🤔${msg.author.id}`)
      )
    ],
  });
}

export function attachThreadThanksHandler(client:Client):void {
  client.on("interactionCreate", asyncCatch(async interaction => {
    if(!(interaction.isSelectMenu() || interaction.isButton())) { return }
    const channel = interaction.channel
    const [category,msgId, type, userId] = interaction.customId.split('🤔')

    if (category !== 'threadThanks') { return }
    if(interaction.user.id !== userId) {
      interaction.reply({
        content: "That's not for you! That prompt is for someone else.",
        ephemeral: true
      })
      return
    }


    if (type === 'cancel') {
      await Promise.all([
        interaction.channel.messages.delete(interaction.message.id),
        interaction.reply({
          content: "Sure thing, message removed!",
          ephemeral: true
        })
      ])
      return
    }

    if (type === 'select') {
      const {values} = interaction as SelectMenuInteraction
      interaction.channel.messages.delete(interaction.message.id)
      const msgPromise = interaction.channel.messages.fetch(msgId)
      const thankedMembers = await interaction.guild.members.fetch({
        user: values
      })

      const thankedUsers = new Collection(thankedMembers.map((item) => [item.user.id, item.user]))

      const response = createResponse(
        thankedUsers, interaction.user.id
      )

      const msg = await msgPromise

      if(!msg) {
        await msg.channel.send(response)
      } else {
        await msg.reply(response)
      }
      if (channel.isThread() && channel.ownerId === interaction.user.id) {
        sendCloseThreadQuery(interaction)
      }
    }
  }))
}

function sendCloseThreadQuery(interaction: SelectMenuInteraction | ButtonInteraction | CommandInteraction) {
  interaction.reply({
    content: "Would you like to archive this thread and mark it as resolved?",
    components: [
      new MessageActionRow()
      .addComponents(
        new MessageButton()
        .setStyle("DANGER")
        .setLabel("Yes please!")
        .setCustomId(`closeThread🤔${interaction.channel.id}🤔close`)
      )
    ],
    ephemeral: true
  })
}

export function attachThreadClose(client:Client) {
  client.on('interactionCreate', asyncCatch(async interaction => {
    if (!(interaction.isButton())) {
      return;
    }
    const id = interaction.customId;
    const msgId = interaction.message.id;
    const [type, channelId, thankeeId] = id.split('🤔');
    if(type !== "closeThread") { return }
    await interaction.deferReply({ ephemeral: true})
    const activeThreads = await interaction.guild.channels.fetchActiveThreads()

    const channel = activeThreads.threads.get(channelId)

    if(!channel || channel.archived === true) {
       interaction.reply({content: ""})
    }

    await interaction.editReply({
      content: "Closed!",
    })
    await channel.setName(`✅ ${channel.name}`)
    await channel.setArchived(true, "Resolved!")
  }));
}
