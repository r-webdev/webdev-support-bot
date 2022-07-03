import type {
  ChatInputApplicationCommandData,
  Client,
  CommandInteraction,
  Guild,
} from 'discord.js';

export type CommandDataWithHandler = ChatInputApplicationCommandData & {
  handler: (client: Client, interaction: CommandInteraction) => Promise<void>;
  onAttach?: (client: Client) => void;
  guildValidate?: (guild: Guild) => boolean;
};
