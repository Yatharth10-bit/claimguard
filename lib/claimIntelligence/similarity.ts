const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "for", "to", "of", "in", "on", "with", "your", "our", "is", "are", "that", "this", "it", "by"]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size && !setB.size) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
}

export function phraseOverlapScore(claim: string, phrases: string[]): number {
  const lower = claim.toLowerCase();
  let hits = 0;
  for (const phrase of phrases) {
    if (lower.includes(phrase.toLowerCase())) hits++;
  }
  return Math.min(1, hits / Math.max(1, phrases.length));
}