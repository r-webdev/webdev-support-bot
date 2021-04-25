import type { Client } from 'discord.js';

import { filterʹ } from '../utils/filter';
import { mapʹ } from '../utils/map';

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
const BATCH_LIMIT = 1000 * 60 * 5;
const CREATED_LIMIT = 1000 * 60 * 25;

const BATCH_SUS_LENGTH = 10;
const GUILD_ID = '618935554171469834';
const CHANNEL_ID = '618935554171469836';

// eslint-disable-next-line unicorn/explicit-length-check
const avg = arr => arr.reduce((sum, num) => sum + num, 0) / (arr.length || 1);

function botJoin(client: Client) {
  const _groups = new Map();

  let _lastBatch = new Map();
  let _lastUserJoin = null;
  let _lastBatchId = null;

  client.on('guildMemberAdd', member => {
    const now = Date.now();
    const newMemberJoinLimit = now - ONE_WEEK;
    if (member.user.createdTimestamp > newMemberJoinLimit) {
      _lastUserJoin = now;
      if (_lastBatchId === null || _lastBatchId < now - BATCH_LIMIT) {
        if (_lastBatchId && _lastBatch.size < BATCH_SUS_LENGTH) {
          _groups.delete(_lastBatchId);
          console.log('clearing');
        }
        _lastBatch = new Map();
        _lastBatchId = _lastUserJoin;
        _groups.set(_lastBatchId, { batch: _lastBatch });
      }
      const _botData = _groups.get(_lastBatchId);

      _lastBatch.set(member.id, { member, probability: 0 });

      const dateJoined = [
        ...mapʹ(
          ({
            member: {
              user: { createdTimestamp },
            },
          }) => createdTimestamp,
          _lastBatch.values()
        ),
      ];
      const avgDateJoined = avg(dateJoined);

      _lastBatch.forEach(item => {
        item.probability =
          (CREATED_LIMIT -
            Math.abs(item.member.user.createdTimestamp - avgDateJoined)) /
          CREATED_LIMIT;
      });

      _botData.batch = [
        ...filterʹ(({ probability }) => true, _lastBatch.values()),
      ];
      _botData.probability = avg(
        _botData.batch.map(({ probability }) => probability)
      );
    }
  });
}
