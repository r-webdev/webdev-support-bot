import { Message } from 'discord.js';

import { POINT_DECAY_TIMER } from '../../env';
import { getTimeDiffToDecay } from '../../helpful_role/point_decay';
import { createEmbed } from '../../utils/discordTools';

const handleDecayRequest = (msg: Message) => {
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
      fields: [
        {
          inline: false,
          name: 'Admin/Moderator',
          value: `<@!${msg.author.id}>`,
        },
      ],
      footerText: 'Admin: Point Decay System',
      provider: 'spam',
      title: 'Point Decay Status',
    })
  );
};

export default handleDecayRequest;
