export const CONFIG = Object.freeze({
  GAME_TITLE: { en: 'Survey Showdown', ar: 'تحدي الاستطلاع' },
  CLASSIC_ROUNDS: 3,
  CLASSIC_ROUND_TIME: 60,
  WRONG_GUESS_PENALTY: 5,
  ALLOW_NEGATIVE_SCORE: false,
  TRADITIONAL_ROUND_MULTIPLIERS: [1, 2, 2, 3],
  TRADITIONAL_ROUND_TIME: 75,
  FAST_MONEY_QUESTIONS: 5,
  FAST_MONEY_TIME_PER_PLAYER: 45,
  FAST_MONEY_BONUS_TARGET: 200,
  ONLINE_ROUND_TIME: 60,
  AI: {
    easy: { accuracy: 0.45, minDelay: 1500, maxDelay: 3200 },
    medium: { accuracy: 0.68, minDelay: 1000, maxDelay: 2400 },
    hard: { accuracy: 0.85, minDelay: 700, maxDelay: 1800 }
  }
});
