import type { Client } from 'discord.js';

import { ApplicationCommandOptionType } from '../../../enums';
import type { Interaction } from '../../../v2/interactions';
import { registerCommand } from '../../../v2/interactions';

async function handleHelpful(
  client: Client,
  interaction: Interaction
): Promise<void> {}

registerCommand({
  description: 'Command for Helpful users',
  handler: handleHelpful,
  name: 'helpful',
  options: [
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'how',
      description: 'How do I become helpful?',
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'hide',
      description: 'Toggle whether or not you will appear as helpful',
    },
  ],
});
