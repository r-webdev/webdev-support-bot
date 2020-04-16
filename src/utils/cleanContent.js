const linebreakPattern = /\n/gim;

module.exports = (msg) =>
  msg.cleanContent.replace(linebreakPattern, ' ').toLowerCase();
