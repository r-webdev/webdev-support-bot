import type {
  ApplicationCommandChannelOptionData,
  ApplicationCommandChoicesData,
  ApplicationCommandData,
  ApplicationCommandNonOptionsData,
  ApplicationCommandOptionData,
  ApplicationCommandSubCommandData,
  ApplicationCommandSubGroupData,
} from 'discord.js';

export function normalizeApplicationCommandData<
  T extends ApplicationCommandData
>(cmd: T): T {
  if (!('type' in cmd) || cmd.type === 'CHAT_INPUT') {
    return {
      ...cmd,
      type: 'CHAT_INPUT',
      defaultPermission: cmd.defaultPermission ?? false,
      options: (cmd.options ?? []).map(normalizeApplicationOptionData),
    };
  }
  return { ...cmd };
}

function normalizeApplicationOptionData<
  T extends
    | ApplicationCommandOptionData
    | ApplicationCommandSubCommandData
    | ApplicationCommandSubGroupData
    | ApplicationCommandNonOptionsData
    | ApplicationCommandChoicesData
    | ApplicationCommandChannelOptionData
>(option: T): T {
  if (option.type === 'SUB_COMMAND') {
    return {
      ...option,
      options: (option.options ?? []).map(normalizeApplicationOptionData),
      required: (option as unknown as { required: boolean }).required ?? false,
    };
  }

  if (option.type === 'SUB_COMMAND_GROUP') {
    return {
      ...option,
      options: (option.options ?? []).map(normalizeApplicationOptionData),
      required: (option as unknown as { required: boolean }).required ?? false,
    };
  }

  return {
    ...option,
    required: (option as unknown as { required: boolean }).required ?? false,
  };
}
