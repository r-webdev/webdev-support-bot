# Webdev Support Bot

[![dependencies][dependencies-image] ][dependencies-url]
[![devdependencies][devdependencies-image] ][devdependencies-url]

[dependencies-image]: https://david-dm.org/ljosberinn/webdev-support-bot.png
[dependencies-url]: https://david-dm.org/ljosberinn/webdev-support-bot
[devdependencies-image]: https://david-dm.org/ljosberinn/webdev-support-bot/dev-status.png
[devdependencies-url]: https://david-dm.org/ljosberinn/webdev-support-bot#info=devDependencies

<p align="center">
    <img src="./logo.png" />
</p>

Bot providing multiple commands to query common sites used during development or helping people on Discord.

Supports

`!github` via `GitHub API`,

`!composer` via `packagist API`,

`!npm` via unofficial `npmjs.com API`,

`!mdn` via parsing [Mozilla Developer Network](http://developer.mozilla.org/),

`!caniuse` via unofficial `caniuse API` and [@mdn/browser-combat-data](https://github.com/mdn/browser-compat-data),

`!bundlephobia` via unofficial `bundlephobia API`,

`!jquery` as explanation on why not to use jquery,

`!php` via parsing [official PHP Docs](http://php.net/).

## Usage / TLDR

```bash
# tag it in discord to receive general help
@bot --help
# provides an example each
!mdn --help
!caniuse --help
!composer --help
!npm --help
!github --help
!bundlephobia --help
```

```bash
# queries MDN with <term>
!mdn <term>
```

```bash
# queries caniuse with <term>
!caniuse <term>
```

```bash
# queries packagist with <package>
!composer <package>
```

```bash
# queries npm with <package>
!npm <package>
```

```bash
# queries github with <term>
!github <term>
```

```bash
# queries bundlephobia with <term>
!bundlephobia <term>
```

- single-result queries will directly show the result
- reacting with a number will filter the result
- reacting with the _red_ or _black_ `x` will remove the request

## Description

By default, shows the first ten results of any given query, unless only one result was found.

Reacting with a number corresponding to the list entry will filter the list and edit the original message, providing more specific information.

## Add to your server by...

...accessing [this link](https://discordapp.com/api/oauth2/authorize?client_id=649967864425611274&scope=bot&permissions=1).

## Demo

<p align="center">
    <img src="./webdev-support-bot-demo.gif" />
</p>

## Development

```bash
git clone https://github.com/ljosberinn/webdev-support-bot/

cd webdev-support-bot

cp .env.example .env # and enter a token

yarn install # or npm install
code .

yarn dev # or npm dev

# or be fancy with a one-liner
git clone https://github.com/ljosberinn/webdev-support-bot/ && cd webdev-support-bot && cp .env.example .env && yarn install && code . && yarn dev
```

## Environment variables

In development, you generally want to take the `.env.example` and rename it to `.env`. You also _shouldn't_ commit your `.env` file. If you make any changes to the environment variables, you should update `.env.example`. accordingly.

### Running tests:

```bash
$ npm test
```

## Found a bug/want to contribute?

Please head over to [GitHub](https://github.com/ljosberinn/webdev-support-bot/issues).
