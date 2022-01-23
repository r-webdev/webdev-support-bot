import type { ThreadChannel } from 'discord.js';

import { Cache } from '../../../utils/Cache.js';

export const cache = new Cache<ThreadChannel, string>({
  maxKeys: 10,
  stdTTL: 3600,
});
