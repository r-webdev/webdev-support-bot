const BACKTICKS = '```';

export type CodeBlockData = {
  code: string;
  language: string;
};

export function createCodeBlockCapturer(
  langs: string[] = []
): (str: string) => Iterable<CodeBlockData> {
  const langAlts = langs.join('|');
  return function* (str: string): Iterable<CodeBlockData> {
    const langRegex = new RegExp(
      String.raw`${BACKTICKS}(?<language>${langAlts})\n(?<code>[\s\S]+?)\n${BACKTICKS}`,
      'gui'
    );
    const matches = str.matchAll(langRegex);
    for (const {
      groups: { language, code },
    } of matches) {
      yield {
        language: language ?? '',
        code: code ?? '',
      };
    }
  };
}
