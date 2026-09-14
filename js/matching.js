const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const PUNCT = /[\p{P}\p{S}]/gu;

export function normalizeText(value, lang = 'en') {
  let text = String(value ?? '').trim().toLowerCase();
  if (lang === 'ar') {
    text = text
      .replace(ARABIC_DIACRITICS, '')
      .replace(/ـ/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي');
  }
  text = text.replace(PUNCT, ' ').replace(/\s+/g, ' ').trim();
  if (lang === 'en') {
    // Conservative singularization only for words long enough to avoid car/card-like mistakes.
    text = text.split(' ').map(word => {
      if (word.length > 5 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
      if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
      return word;
    }).join(' ');
  }
  return text;
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

export function similarity(a, b) {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

function tokenSimilarity(a, b) {
  const aa = new Set(a.split(' ').filter(Boolean));
  const bb = new Set(b.split(' ').filter(Boolean));
  if (!aa.size || !bb.size) return 0;
  let common = 0;
  for (const token of aa) if (bb.has(token)) common += 1;
  return common / Math.max(aa.size, bb.size);
}

export function answerMatches(input, answer, lang = 'en') {
  const normalizedInput = normalizeText(input, lang);
  if (!normalizedInput) return false;
  const candidates = [answer.text?.[lang], ...(answer.aliases?.[lang] || [])]
    .map(v => normalizeText(v, lang))
    .filter(Boolean);

  if (candidates.includes(normalizedInput)) return true;

  for (const candidate of candidates) {
    if (normalizedInput.length >= 5 && candidate.length >= 5) {
      const tokenScore = tokenSimilarity(normalizedInput, candidate);
      if (tokenScore >= 0.8) return true;
    }

    const minLen = Math.min(normalizedInput.length, candidate.length);
    const threshold = minLen <= 4 ? 0.97 : minLen <= 7 ? 0.86 : 0.82;
    if (similarity(normalizedInput, candidate) >= threshold) return true;
  }
  return false;
}

export function matchQuestionAnswer(question, input, lang = 'en') {
  if (!question?.answers) return null;
  return question.answers.find(answer => answerMatches(input, answer, lang)) || null;
}

export function findAnswerResult(question, input, lang = 'en', revealedIds = new Set()) {
  const normalized = normalizeText(input, lang);
  if (!normalized) return { type: 'empty' };
  const answer = matchQuestionAnswer(question, input, lang);
  if (!answer) return { type: 'wrong', normalized };
  if (revealedIds.has(answer.id)) return { type: 'duplicate', answer };
  return { type: 'correct', answer };
}
