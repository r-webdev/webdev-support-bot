import { Message } from 'discord.js';
import { createMarkdownCodeBlock } from '../../utils/discordTools';

const message = `Unless you're supporting ancient legacy systems, always add \`type="module"\` to all your script tags:
${createMarkdownCodeBlock(
  '<script type="module" src="main.js"></script>',
  'html'
)}
**It will**:
— As the name suggests, allow you to import modules, which makes it easier to organize your code.
— Enable strict mode by default. This makes your code run faster, and reports more runtime errors instead of silently ignoring them.
— Execute your code only after the DOM has initialized, which makes DOM manipulation easier. Thanks to this, you won't need to listen to onload/readystatechange events.
— Prevent top level variables from implicitly polluting the global namespace.
— Allow you to use top-level await in supported engines
— Load and parse your code asynchronously, which improves load performance.

**TL;DR**: There's no reason not to add it in when developing for modern browsers, and it makes programming JS a lot more pleasant.`;

export default async function handleModuleRequest(msg: Message) {
  await msg.channel.send(message);
}
