const { createMarkdownLink } = require('../utils/discordTools');

module.exports = `
:bulb: *react with a number (:one:, :two:, ...) to filter your result*
:neutral_face: *react with ❌ or ✖️ to delete*
:point_up: *supports npm and mdn, caniuse & composer upcoming*
:gear: *issues? feature requests? head over to ${createMarkdownLink(
  'github',
  process.env.REPO_LINK,
)}*`;
