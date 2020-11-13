import { Message } from 'discord.js';

const handleResetLockfileRequest = async (msg: Message) => {
  await msg.channel.send(`**How to reset your lockfile:**

1. Remove your lockfile — it is either \`package-lock.json\` or when using yarn \`yarn.lock\`
2. Delete the node_modules directory
3. Install the dependencies again with either \`npm install\` or \`yarn\`
`);
};

export default handleResetLockfileRequest;
