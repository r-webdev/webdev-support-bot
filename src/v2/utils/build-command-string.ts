import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js';

export const buildCommandString = (
  interaction: ChatInputCommandInteraction,
): string => {
  const commandName = interaction.commandName;
  const options: string[] = [];

  interaction.options.data.forEach(option => {
    const value = option.value;

    switch (option.type) {
      case ApplicationCommandOptionType.User:
        options.push(`${option.name}: ${value}`);
        break;
      case ApplicationCommandOptionType.String:
        options.push(`${option.name}: ${value}`);
        break;
      case ApplicationCommandOptionType.Integer:
      case ApplicationCommandOptionType.Number:
        options.push(`${option.name}: ${value}`);
        break;
      case ApplicationCommandOptionType.Boolean:
        options.push(`${option.name}: ${value}`);
        break;
      default:
        options.push(`${option.name}: ${value}`);
    }
  });

  return `/${commandName} ${options.join(' ')}`;
};
