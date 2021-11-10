import type {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Message,
  SelectMenuInteraction,
  ThreadMember,
} from 'discord.js';
import {
  MessageActionRow,
  MessageButton,
  Collection,
  MessageSelectMenu,
} from 'discord.js';

import { POINT_LIMITER_IN_MINUTES } from '../../env.js';
import { asyncCatch } from '../../utils/asyncCatch.js';
import { _ } from '../../utils/pluralize.js';
import { createResponse } from './createResponse.js';
import type { ThanksInteractionType } from './db_model.js';
import { ThanksInteraction } from './db_model.js';

const memoryCache = new Map<string, Message>();

export async function handleThreadThanks(msg: Message): Promise<void> {
  const { channel } = msg;
  if (!channel.isThread()) {
    return;
  }

  const oldResponseId = [msg.author.id, msg.channel.id].join('|');
  if (memoryCache.has(oldResponseId)) {
    await memoryCache.get(oldResponseId).delete().catch(error => { console.error("message already deleted"); }).finally(() => { memoryCache.delete(oldResponseId) });
  }
  // channel.members.fetch should return a collection
  const [members, previousInteractions]: [
    Collection<string, ThreadMember>,
    ThanksInteractionType[]
  ] = await Promise.all([
    channel.members.fetch(undefined, { cache: false }) as unknown as Promise<
      Collection<string, ThreadMember>
    >,
    ThanksInteraction.find({
      thanker: msg.author.id,
      createdAt: {
        $gte: Date.now() - Number.parseInt(POINT_LIMITER_IN_MINUTES) * 60_000,
      },
    }),
  ]);
  const previouslyThankedIds = new Set(
    previousInteractions.flatMap(x => x.thankees)
  );
  const alreadyThanked = [];

  const otherMembers = members.filter(x => {
    const notSelf = x.user.id !== msg.author.id;
    const notBot = !x.user.bot;
    const notTimeout = !previouslyThankedIds.has(x.user.id);

    if (!notTimeout) {
      alreadyThanked.push(x);
    }

    return notSelf && notBot && notTimeout;
  });

  if (otherMembers.size === 0) {
    return;
  }

  const response = await msg.reply({
    content: [
      "Hey, it looks like you're trying to thank one or many users, but haven't specified who. Who would you like to thank?",
      alreadyThanked.length > 0
        ? _`There ${_.mapper({ 1: 'is' }, 'are')} **${_.n} user${
            _.s
          } that you can't thank as you've thanked them recently**, so they won't show up as an option.`(
            alreadyThanked.length
          )
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
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
          .setLabel('Nevermind')
          .setStyle('SECONDARY')
          .setCustomId(`threadThanks🤔${msg.id}🤔cancel🤔${msg.author.id}`)
      ),
    ],
  });

  if (msg.channel?.id) {
    memoryCache.set([msg.author.id, msg.channel.id].join('|'), response);
  }
}

export function attachThreadThanksHandler(client: Client): void {
  client.on(
    'interactionCreate',
    asyncCatch(async interaction => {
      if (!(interaction.isSelectMenu() || interaction.isButton())) {
        return;
      }
      const {channel} = interaction;
      const [category, msgId, type, userId] = interaction.customId.split('🤔');

      if (category !== 'threadThanks') {
        return;
      }
      if (interaction.user.id !== userId) {
        interaction.reply({
          content: "That's not for you! That prompt is for someone else.",
          ephemeral: true,
        });
        return;
      }

      if (type === 'cancel') {
        await Promise.all([
          interaction.channel.messages.delete(interaction.message.id),
          interaction.reply({
            content: 'Sure thing, message removed!',
            ephemeral: true,
          }),
        ]);
        return;
      }

      if (type === 'select') {
        const { values } = interaction as SelectMenuInteraction;
        interaction.channel.messages.delete(interaction.message.id);
        const msgPromise = interaction.channel.messages.fetch(msgId);
        const thankedMembers = await interaction.guild.members.fetch({
          user: values,
        });

        const thankedUsers = new Collection(
          thankedMembers.map(item => [item.user.id, item.user])
        );

        const responseData = createResponse(thankedUsers, interaction.user.id);
        let response: Message;

        const msg = await msgPromise;
        if (!msg) {
          response = await msg.channel.send(responseData);
        } else {
          response = await msg.reply(responseData);
        }

        const name = [interaction.channelId, interaction.user.id].join('|');
        if (memoryCache.has(name)) {
          const item = memoryCache.get(name);
          memoryCache.delete(name);
          await item.delete();
        }

        if (channel.isThread() && channel.ownerId === interaction.user.id) {
          sendCloseThreadQuery(interaction);
        }

        await ThanksInteraction.create({
          thanker: userId,
          guild: interaction.guildId,
          channel: interaction.channelId,
          thankees: thankedUsers.map(u => u.id),
          responseMsgId: response.id,
        });
      }
    })
  );
}

function sendCloseThreadQuery(
  interaction: SelectMenuInteraction | ButtonInteraction | CommandInteraction
) {
  interaction.reply({
    content: 'Would you like to archive this thread and mark it as resolved?',
    components: [
      new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle('PRIMARY')
          .setLabel('Yes please!')
          .setCustomId(`closeThread🤔${interaction.channel.id}🤔close`)
      ),
    ],
    ephemeral: true,
  });
}

export function attachThreadClose(client: Client) {
  client.on(
    'interactionCreate',
    asyncCatch(async interaction => {
      if (!interaction.isButton()) {
        return;
      }
      const id = interaction.customId;
      const msgId = interaction.message.id;
      const [type, channelId, thankeeId] = id.split('🤔');
      if (type !== 'closeThread') {
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      const activeThreads =
        await interaction.guild.channels.fetchActiveThreads();

      const channel = activeThreads.threads.get(channelId);

      if (!channel || channel.archived) {
        interaction.reply({ content: '' });
      }

      await interaction.editReply({
        content: 'Closed!',
      });
      await channel.setName(`✅ ${channel.name}`);
      await channel.setArchived(true, 'Resolved!');
    })
  );
}
