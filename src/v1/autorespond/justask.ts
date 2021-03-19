import { Message } from 'discord.js';
import { stripMarkdownQuote } from '../utils/content_format';

const rePeople = String.raw`(?:any|some) (?:one|1+)`;
const reHas = String.raw`(?:ha(?:s|ve)|got)`;
const reQuantifier = String.raw`(?:any?|some|much)`;
const reHistory = String.raw`(?: prior| past)`;

const heuristicJustAskRegex = new RegExp(
  String.raw`${rePeople}(?: here)? ${reHas}(?: ${reQuantifier}${reHistory}?)? experiences?`.replace(
    ' ',
    String.raw`\s*`
  ),
  'ui'
);

export function detectVagueQuestion(msg: Message) {
  const content = stripMarkdownQuote(msg.cleanContent);
  if (content.split(' ').length < 60 && content.match(heuristicJustAskRegex)) {
    msg.reply(`
**Don't ask to ask. Just Ask**
Here's why https://sol.gfxile.net/dontask.html

(This was an automated response)
`);
    return true;
  }
}
