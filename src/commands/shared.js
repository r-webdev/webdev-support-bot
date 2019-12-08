const { createMarkdownLink } = require('../utils/discordTools');

module.exports = `
:bulb: *react with a number (:one:, :two:, ...) to filter your result*
:neutral_face: *react with ❌ or ✖️ to delete*
:point_up: *supports !npm, !composer, !mdn*
:gear: *issues? feature requests? head over to ${createMarkdownLink(
  'github',
  process.env.REPO_LINK,
)}*`;
