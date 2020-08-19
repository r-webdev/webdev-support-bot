import { Message } from 'discord.js';

import { POINT_DECAY_TIMER, ADMIN_ROLE_ID, MOD_ROLE_ID } from '../../env';
import { getTimeDiffToDecay, decay } from '../../helpful_role/point_decay';
import { createEmbed } from '../../utils/discordTools';
import { generateCleanContent } from '../../utils/content_format';

const getDecayStatus = (msg: Message) => {
  const { diff } = getTimeDiffToDecay();
  const timer = Number.parseInt(POINT_DECAY_TIMER);

  let [hours, minutes]: Array<string | number> = (timer - diff)
    .toString()
    .split('.');

  hours = Number.parseInt(hours);
  minutes = (Number.parseInt(minutes.slice(0, 2)) * 60) / 100;

  const description = `The point decay will occur in ${
    hours !== 0
      ? `${hours} hour${hours === 1 ? '' : 's'}${minutes !== 0 ? ' and ' : ''}`
      : ''
  }${minutes.toString().split('.')[0]}${
    minutes !== 0 ? ` minute${minutes === 1 ? '' : 's'}` : ''
  }.`;

  msg.channel.send(
    createEmbed({
      description,
      footerText: 'Point Decay System',
      provider: 'spam',
      title: 'Point Decay Status',
    })
  );
};

const handleDecayRequest = async (msg: Message) => {
  const [_, flag] = generateCleanContent(msg).split(' ');

  if (!flag) {
    return getDecayStatus(msg);
  }

  const isAdmin = msg.member.roles.cache.find(
    r => r.id === ADMIN_ROLE_ID || r.id === MOD_ROLE_ID
  );

  if (!isAdmin) {
    return;
  }

  switch (flag) {
    case 'force':
      await decay(msg, true);
      break;
    default:
      return;
  }
};

export default handleDecayRequest;
