# Webdev Support Bot

<p align="center">
    <img src="./logo-large.png" />
</p>

Bot providing multiple commands to query common sites used during development or helping people on Discord.

Supports

`!composer` via `packagist`,

`!npm`,

`!mdn` for `Mozilla Developer Network` and

`!caniuse` via `caniuse` and `mdn-browser-combat-data`.

## Usage / TLDR
```bash
# tag it in discord to receive general help
@bot --help
# provides an example each
!mdn --help
!caniuse --help
!composer --help
!npm --help
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

- reacting with a number will filter the result
- reacting with the _red_ or _black_ `x` will remove the request

## Description

By default, shows the first ten results of any given query.

Reacting with a number corresponding to the list entry will filter the list and edit the original message, providing more specific information.

## Add to your server by...

...accessing [this link](https://discordapp.com/api/oauth2/authorize?client_id=649967864425611274&scope=bot&permissions=1).

## Development

```bash
git clone https://github.com/ljosberinn/webdev-support-bot/

cd webdev-support-bot

yarn install # or npm install
code .

yarn start # or npm start

# or be fancy with a one-liner
git clone https://github.com/ljosberinn/webdev-support-bot/ && cd webdev-support-bot && yarn install && code . && yarn start
```

## Found a bug/want to contribute?

Please head over to [GitHub](https://github.com/ljosberinn/webdev-support-bot/issues).
