import type {
  EmbedField,
  GuildMember,
  GuildMemberRoleManager} from 'discord.js';
import { MessageEmbed } from 'discord.js';

import { closeCommand } from './close';
import { reportMessage } from './reportMsg';
import { reportUser } from './reportUser';
import { sendCommand } from './send';


export const commands = [sendCommand, reportMessage, reportUser, closeCommand           ];
