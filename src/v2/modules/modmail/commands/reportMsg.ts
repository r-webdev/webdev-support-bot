import { MessageEmbed } from "discord.js";

import type { CommandDataWithHandler } from "../../../../types";
import { SERVER_ID, MOD_ROLE_ID } from "../../../env";
import { createModMailThread } from "../util/createModMailThread";
import { createReporterEmbed, createReporteeEmbed, createInitialEmbed } from "../util/embeds";


export const reportMessage: CommandDataWithHandler = {
  type: 'MESSAGE',
  name: 'Report To Mods',
  guildValidate: guild => guild.id === SERVER_ID,
  async handler(client, interaction) {
    if (!interaction.isContextMenu()) {
      return;
    }

    if (interaction.targetType !== 'MESSAGE') {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const reportedMsg = await interaction.channel.messages.fetch(
      interaction.targetId
    );
    const messages = await interaction.channel.messages.fetch({
      before: reportedMsg.id,
      limit: 25,
    });

    const member = await interaction.guild.members.fetch(
      interaction.member.user.id
    );

    await interaction.editReply({
      content: "Is this the message you'd like to report to mods",
      embeds: [
        new MessageEmbed()
          .setTitle('Report Details')
          .setDescription('Transcript of last 10 messages')
          .setURL(reportedMsg.url)
          .addFields(
            [reportedMsg, ...messages.values()]
              .reverse()
              .filter(message => !message.author.bot)
              .slice(-10)
              .map(message => {
                const attachment =
                  message.attachments.size > 0
                    ? `[${message.attachments.size} Attachment(s) ${message.url}] `
                    : '';
                return {
                  name: `${
                    message.author.id === reportedMsg.author.id ? '⚠️ ' : ''
                  }${message.author.username}#${
                    message.author.discriminator
                  } (${message.author.id}) @ <t:${Math.floor(
                    message.createdTimestamp / 1000
                  )}>`,
                  value: `${attachment}${message.content}`,
                };
              })
          ),
      ],
    });

    const thread = await createModMailThread(
      interaction.guild,
      interaction.user
    );

    const initialMsg = await thread.send({
      content: `<@&${MOD_ROLE_ID}>`,
      embeds: [
        createInitialEmbed(),
        createReporterEmbed(member),
        createReporteeEmbed(reportedMsg.member),
        new MessageEmbed()
          .setTitle('Report Details')
          .setDescription('Transcript of last 10 messages')
          .setURL(reportedMsg.url)
          .addFields(
            [reportedMsg, ...messages.values()]
              .reverse()
              .filter(message => !message.author.bot)
              .slice(-10)
              .map(message => {
                return {
                  name: `${
                    message.author.id === reportedMsg.author.id ? '⚠️ ' : ''
                  }${message.author.username}#${
                    message.author.discriminator
                  } (${message.author.id}) @ <t:${Math.floor(
                    message.createdTimestamp / 1000
                  )}>`,
                  value: `${message.content}`,
                };
              })
          ),
      ],
    });

    await initialMsg.pin();
  },
};
