
// modified from https://github.com/wessberg/intl-list-format/blob/master/src/typings.d.ts
declare namespace Intl {
  function getCanonicalLocales(locales: string | string[] | undefined): string[];

  type Locale = string;
  type Locales = Locale[];
  type Type = "conjunction" | "disjunction" | "unit";
  type Style = "long" | "short" | "narrow";
  type LocaleMatcher = "lookup" | "best fit";

  type ListFormatOptions = {
    type: Type;
    style: Style;
    localeMatcher: LocaleMatcher;
  }

  type ResolvedListFormatOptions = {
    type: Type;
    style: Style;
    locale: Locale;
  }

  type ElementPartition = {
    type: "element";
    value: ListPartition[] | string;
  }

  type ListPartitionBase = {
    value: string;
  }

  type LiteralPartition = ListPartitionBase & {
    type: "literal";
  }

  type ListPartition = ElementPartition | LiteralPartition;

  type ListPartitions = readonly ListPartition[];

  class ListFormat {
    public constructor(locales?: Locale | Locales | undefined, options?: Partial<ListFormatOptions>);

    public static supportedLocalesOf(locales: Locale | Locales, options?: Intl.SupportedLocalesOptions | undefined): Locales;

    public format(list?: Iterable<string>): string;

    public formatToParts(list?: Iterable<string>): ListPartitions;

    public resolvedOptions(): ResolvedListFormatOptions;
  }
}
