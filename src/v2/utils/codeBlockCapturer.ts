const BACKTICKS = '```';

export type CodeBlockData = {
  code: string;
  language: string;
};

export function createCodeBlockCapturer(langs: string[] = []) {
  const langAlts = langs.join('|');
  return function* (str: string): Generator<CodeBlockData> {
    const langRegex = new RegExp(
      String.raw`${BACKTICKS}(?<language>${langAlts})\n(?<code>[\s\S]+?)\n${BACKTICKS}`,
      'gi'
    );
    const matches = str.matchAll(langRegex);
    for (const {
      groups: { language, code },
    } of matches) {
      yield {
        language: language || '',
        code: code || '',
      };
    }
  };
}
