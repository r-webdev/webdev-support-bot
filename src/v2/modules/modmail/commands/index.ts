import { closeCommand } from './close';
import { initiateModmail } from './initiateModmail';
import { reportMessage } from './reportMsg';
import { reportUser } from './reportUser';
import { sendCommand } from './send';


export const modmailCommands = [sendCommand, reportMessage, initiateModmail, reportUser, closeCommand];
