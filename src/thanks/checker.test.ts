import checker from './checker';

describe('thanks checked', () => {
  test('returns false if thanks not in message', () => {
    expect(checker('naab')).toBe(false);
  });

  test('returns true if thanks in message', () => {
    expect(checker('thanks friend')).toBe(true);
    expect(checker('ty friend')).toBe(true);
  });

  test('returns true if thanks in message, case insensitive', () => {
    expect(checker('tHaNKs fRiEnDO')).toBe(true);
    expect(checker('tY fRiEnDO')).toBe(true);
  });

  test('returns false if ty is part of a word', () => {
    expect(checker('time for a putty party')).toBe(false);
  });

  test('returns true if ty is followed by punctuation', () => {
    expect(checker('ty, friend')).toBe(true);
  });
});
