import type { ApplicationCommandData, Client, CommandInteraction, Interaction } from "discord.js";

export type CommandDataWithHandler = ApplicationCommandData & { handler: (client: Client, interaction:CommandInteraction) => Promise<void> }
