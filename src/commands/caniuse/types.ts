export interface Ie {
  [key: string]: string;
}

export interface Edge {
  [key: string]: string;
}

export interface Firefox {
  [key: string]: string;
}

export interface Chrome {
  [key: string]: string;
}

export interface Safari {
  [key: string]: string;
}

export interface Opera {
  [key: string]: string;
}

export interface IosSaf {
  [key: string]: string;
}

export interface OpMini {
  [key: string]: string;
}

export interface Android {
  [key: string]: string;
}

export interface Bb {
  [key: string]: string;
}

export interface OpMob {
  [key: string]: string;
}

export interface AndChr {
  [key: string]: string;
}

export interface AndFf {
  [key: string]: string;
}

export interface IeMob {
  [key: string]: string;
}

export interface AndUc {
  [key: string]: string;
}

export interface Samsung {
  [key: string]: string;
}

export interface AndQq {
  [key: string]: string;
}

export interface Baidu {
  [key: string]: string;
}

export interface Kaios {
  [key: string]: string;
}

export interface Stats {
  ie: Ie;
  edge: Edge;
  firefox: Firefox;
  chrome: Chrome;
  safari: Safari;
  opera: Opera;
  ios_saf: IosSaf;
  op_mini: OpMini;
  android: Android;
  bb: Bb;
  op_mob: OpMob;
  and_chr: AndChr;
  and_ff: AndFf;
  ie_mob: IeMob;
  and_uc: AndUc;
  samsung: Samsung;
  and_qq: AndQq;
  baidu: Baidu;
  kaios: Kaios;
}

export type ExtendedCanIUseData = {
  description: string;
  spec: string;
  status: string;
  stats: Stats;
  bug_count: number;
  link_count: number;
  notes: string;
  notes_by_num: { [key: number]: string };
  ucprefix: boolean;
  parent: string;
  children?: any;
  keywords: string;
  date_published: string;
  ie_id: string;
  chrome_id: string;
  firefox_id: string;
  webkit_id: string;
  baseCategories: string[];

  title: string;
  path?: string;
  support: {
    chrome: Chrome;
    and_chr: AndChr;
    edge: Edge;
    firefox: Firefox;
    and_ff: AndFf;
    ie: Ie;
    opera: Opera;
    op_mob: OpMob;
    safari: Safari;
    ios_saf: IosSaf;
    samsung: Samsung;
    android: Android;
  };
  amountOfBrowsersWithData: number;
  mdnStatus: {
    experimental: boolean;
    standard_track: boolean;
    deprecated: boolean;
  };
  mdn_url: string;
};
