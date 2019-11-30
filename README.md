# MDN Bot

Simple bot that parses MDN (Mozilla Developer Network) for possible results and responds to the user initiating the search.

## Usage / TLDR

```bash
!mdn localstorage
```

- reacting with a number will filter the result

## Description

By default, shows the first three results which can be helpful in case of ambiguous terms, such as `Map` (`<map>`-HTMLTag, `Map.prototype`).

Shows the first 10 results (first page of MDN search).

Reacting with a number coresponding to the list entry will filter the list.

## Add to your server by...

...accessing [this link](https://discordapp.com/api/oauth2/authorize?client_id=649967864425611274&scope=bot&permissions=1).

## Development

```bash
git clone https://github.com/ljosberinn/discord-mdn-bot/

cd discord-mdn-bot

yarn install # or npm install
yarn start # or npm start
```

## Found a bug/want to contribute?

- please head over to [GitHub](https://github.com/ljosberinn/discord-mdn-bot/issues)
