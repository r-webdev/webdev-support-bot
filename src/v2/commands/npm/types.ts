export type Links = {
  npm: string;
  homepage: string;
  repository: string;
  bugs: string;
};

export type Author = {
  name: string;
  email: string;
};

export type Publisher = {
  username: string;
  email: string;
};

export type Maintainer = {
  username: string;
  email: string;
};

export type NPMResponse = {
  name: string;
  scope: string;
  version: string;
  description: string;
  keywords: string[];
  date: Date;
  links: Links;
  author: Author;
  publisher: Publisher;
  maintainers: Maintainer[];
};
