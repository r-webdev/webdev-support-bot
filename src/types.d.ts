import type {
  ApplicationCommandData,
  ApplicationCommandPermissionsManager,
  ChatInputApplicationCommandData,
  Client,
  CommandInteraction,
  ContextMenuInteraction,
  Guild,
  Interaction,
} from 'discord.js';

export type CommandDataWithHandler = ApplicationCommandData & {
  handler: (
    client: Client,
    interaction: CommandInteraction | ContextMenuInteraction
  ) => Promise<void>;
  onAttach?: (client: Client) => void;
  guildValidate?: (guild: Guild) => boolean;
  managePermissions?: (
    guild: Guild,
    permissions: ApplicationCommandPermissionsManager<
      {
        guild: GuildResolvable;
      },
      {
        guild: GuildResolvable;
      },
      {
        guild: GuildResolvable;
      },
      Guild,
      string
    >
  ) => Promise<void>;
};
