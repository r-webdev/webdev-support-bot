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
  ])('acts only on appropriate input', (string, result) => {
    expect(checker(string)).toBe(result);
  });
});
