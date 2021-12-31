import type {
  ApplicationCommandChannelOptionData,
  ApplicationCommandChoicesData,
  ApplicationCommandData,
  ApplicationCommandNonOptionsData,
  ApplicationCommandOptionData,
  ApplicationCommandSubCommandData,
  ApplicationCommandSubGroupData,
} from 'discord.js';
import { ApplicationCommandTypes } from 'discord.js/typings/enums';

export function normalizeApplicationCommandData<
  T extends ApplicationCommandData
>(cmd: T): T {
  if (!("type" in cmd) || cmd.type === 'CHAT_INPUT' || cmd.type === ApplicationCommandTypes.CHAT_INPUT) {
    return {
      ...cmd,
      options: (cmd.options ?? []).map(normalizeApplicationOptionData),
    };
  }

  return {...cmd, description: '', options: []}
}

function normalizeApplicationOptionData <T extends
| ApplicationCommandOptionData
| ApplicationCommandSubCommandData
| ApplicationCommandSubGroupData
| ApplicationCommandNonOptionsData
| ApplicationCommandChoicesData
|ApplicationCommandChannelOptionData>(
  option:T

): T {
  if (option.type === 'SUB_COMMAND') {
    return {
      ...option,
      options: (option.options ?? []).map(normalizeApplicationOptionData),
      required: (option as unknown as {required: boolean}).required ?? false,
    }
  }

  if (option.type === 'SUB_COMMAND_GROUP') {
    return {
      ...option,
      options: (option.options ?? []).map(normalizeApplicationOptionData),
      required: (option as unknown as {required: boolean}).required ?? false,
    }
  }

  return {
    ...option,
    required: (option as unknown as {required: boolean}).required ?? false,
  } ;
}
