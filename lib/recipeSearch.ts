const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** NFC + lowercase + collapse spaces */
export function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Remove Vietnamese diacritics (đ -> d) */
export function fold(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS, "").replace(/đ/g, "d");
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export interface SearchIndex {
  titleWords: string[];
  titleFolded: string[];
  descWords: string[];
  descFolded: string[];
}

export function buildSearchIndex(title: string, description = ""): SearchIndex {
  const titleWords = tokenize(title);
  const descWords = tokenize(description);
  return {
    titleWords,
    titleFolded: titleWords.map(fold),
    descWords,
    descFolded: descWords.map(fold),
  };
}

/**
 * Returns 0 when the recipe does not match, otherwise a relevance score.
 * Rules:
 *  - Every query word must match a WHOLE word (no substring hits).
 *  - If the query word has accents ("gà"), the accents must match exactly.
 *  - If it has none ("ga"), it matches accent-insensitively (gà, ga...).
 *  - Title matches rank far above description matches.
 */
export function scoreRecipe(index: SearchIndex, query: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 1;

  let score = 0;

  for (const token of tokens) {
    const hasMarks = fold(token) !== token;
    const inTitle = hasMarks
      ? index.titleWords.includes(token)
      : index.titleFolded.includes(token);
    const inDesc = hasMarks
      ? index.descWords.includes(token)
      : index.descFolded.includes(token);

    if (inTitle) score += 10;
    else if (inDesc) score += 3;
    else return 0; // all words must match (AND)
  }

  const phrase = ` ${tokens.join(" ")} `;
  const title = ` ${index.titleWords.join(" ")} `;
  if (title === phrase)
    score += 30; // title is exactly the query
  else if (title.includes(phrase)) score += 20; // exact phrase in title
  if (index.titleWords[0] === tokens[0]) score += 5; // title starts with it

  return score;
}
