export interface BundlephobiaResponse {
  package: {
    name: string;
    scope: string;
    version: string;
    description: string;
    keywords: string[];
    date: Date;
    links: {
      npm: string;
      homepage: string;
      repository: string;
      bugs: string;
    };
    publisher: {
      username: string;
      email: string;
    };
    maintainers: {
      username: string;
      email: string;
    }[];
    author: {
      name: string;
      email: string;
      url: string;
      username: string;
    };
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  searchScore: number;
  highlight: string;
}

export interface ExtendedBundlephobiaResponse {
  assets: { gzip: number; name: string; size: string; type: string }[];
  dependencyCount: number;
  gzip: number;
  size: number;
  scoped: boolean;
  hasSideEffects: boolean;
  hasJSNext: boolean;
  hasJSModule: boolean;
  version: string;
  name: string;
  repository: string;
  description: string;
  dependencySizes: { approximateSize: number; name: string }[];
}

export interface Fields {
  gzip: number;
  previousVersionSize?: number;
  dependencies: number;
  hasSideEffects: boolean;
  isTreeShakeable: boolean;
  estDownloadTimeEdge: string;
  estDownloadTimeEmerging3g: string;
  similarPackages: {
    label: string | undefined;
    packages: { name: string; size: number }[];
  };
}

export interface SimilarPackagesResponse {
  name: string;
  category: {
    label: string;
    score: number;
    tags: { tag: string; weight: number }[];
    similar: string[];
  };
}
