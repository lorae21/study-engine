export interface Paper {
  title: string;
  abstract: string;
  url: string;
  source: string;
}

export interface SearchResponse {
  papers: Paper[];
}

export interface SynthesizeResponse {
  answer: string;
}
