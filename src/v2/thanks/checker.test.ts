import checker from './checker';

describe('thanks checked', () => {
  test.each([
    ['naab', false],
    ['thanks friend', true],
    ['Thanks friend', true],
    ['ty friend', true],
    ['tHaNKs fRiEnDO', true],
    ['tY fRiEnDO', true],
    ['time for a putty party', false],
    ['"ty, friend"', true],
    ['"nty, friend"', false],
    ['"no ty, friend"', false],
    ['"no thanks, friend"', false],
    [
      'https://github.com/ljosberinn/webdev-support-bot/blob/master/src/thanks/index.ts',
      false,
    ],
    ['merci beaucoup', true],
    ['non merci', false],
    ['danke', true],
    ['谢谢', true],
    ['nein danke', false],
    ['Еще раз спасибо за вашу помощь', true],
    ['cheers love, the cavalries here', true],
  ])('acts only on appropriate input (case %s)', (string, result) => {
    expect(checker(string)).toBe(result);
  });
});
