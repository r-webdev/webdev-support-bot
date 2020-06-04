export interface PackagistResponse {
  results: {
    name: string;
    description: string;
    url: string;
    repository: string;
    downloads: number;
    favers: number;
  }[];
  total: number;
  next?: string;
}

export interface ExtendedPackagistResponse {
  package: {
    name: string;
    description: string;
    time: Date;
    maintainers: {
      name: string;
      avatar_url: string;
    }[];
    versions: Versions;
    type: string;
    repository: string;
    github_stars: number;
    github_watchers: number;
    github_forks: number;
    github_open_issues: number;
    language: string;
    dependents: number;
    suggesters: number;
    downloads: Downloads;
    favers: number;
  };
}

export interface Versions {
  'dev-master': Version; // dev-master is only a pointer to an actual version we care about
  [otherVersions: string]: Version;
}

export interface Version {
  name: string;
  description: string;
  keywords: string[];
  homepage: string;
  version: string;
  version_normalized: string;
  license: string[];
  funding: boolean;
  time: Date;
  source: {
    type: string;
    url: string;
    reference: string;
  };
  require: { [key: string]: string };
  authors: {
    name: string;
    email: string;
  }[];
}

export interface Downloads {
  total: number;
  monthly: number;
  daily: number;
}
