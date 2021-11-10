import { Message } from 'discord.js';

const handleCodeRequest = async (msg: Message) => {
  await msg.channel.send(`**Why you shouldn't use jQuery:**

1. jQuery is a legacy library. Standardized features like querySelector, CSS animations, and fetch make many of its features obsolete.
2. Using jQuery over standard features is a waste of bandwidth.
3. Because jQuery is so bloated, using jQuery often means using jQuery for everything, which means you learn less about standard web development.
4. jQuery has fallen out of fashion, and full frameworks (React, Angular, Vue) are more popular.
5. With modern frameworks you declare a state and your UI reflects your state. Rather than with jQuery having to manage both the state and the UI all at the same time.
6. jQuery's cross-browser support can be substituted with the few polyfills you actually need. This also makes it easier to update when features become better supported.
7. If you really just want a shorthand for querySelectorAll, consider bling dot js`);
};

export default handleCodeRequest;
