import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_QUESTIONS, validateQuestionBank } from '../js/questions.js';
import { normalizeText, answerMatches, matchQuestionAnswer } from '../js/matching.js';
import { GameEngine } from '../js/game.js';

test('question bank contains at least 60 valid bilingual questions', () => {
  assert.ok(BUILTIN_QUESTIONS.length >= 60);
  assert.deepEqual(validateQuestionBank(BUILTIN_QUESTIONS), []);
  for (const q of BUILTIN_QUESTIONS) {
    assert.ok(q.question.en && q.question.ar);
    assert.ok(q.answers.length >= 3 && q.answers.length <= 8);
  }
});

test('Arabic normalization removes diacritics and normalizes alef/ya', () => {
  assert.equal(normalizeText('  إِجَابَة ــ جَمِيلَى!  ', 'ar'), 'اجابة جميلي');
});

test('known aliases match in English and Arabic', () => {
  const q = BUILTIN_QUESTIONS.find(q => q.id === 'travel_beach_001');
  assert.equal(matchQuestionAnswer(q, 'beach towel', 'en')?.text.en, 'Towel');
  assert.equal(matchQuestionAnswer(q, 'فوطة بحر', 'ar')?.text.en, 'Towel');
});

test('short distinct words are not accepted by fuzzy matching', () => {
  const answer = { text:{en:'car',ar:'سيارة'}, aliases:{en:['car'],ar:['سيارة']} };
  assert.equal(answerMatches('card', answer, 'en'), false);
});

test('classic engine awards score once and prevents duplicate points', async () => {
  const q = BUILTIN_QUESTIONS.find(q => q.id === 'food_burger_002');
  const events = [];
  const engine = new GameEngine({
    questions:[q], language:'en',
    settings:{roundTime:30,reducedMotion:true,aiDifficulty:'medium'},
    onChange:()=>{}, onEvent:(type,payload)=>events.push([type,payload])
  });
  engine.start('classic-local',['A','B']);
  await new Promise(r=>setTimeout(r,120));
  assert.equal(engine.getState().phase, 'round_active');
  const first = engine.submit('cheese');
  assert.equal(first.type, 'correct');
  assert.equal(engine.getState().players[0].score, 31);
  // Active player changed; same board answer is duplicate and scores nothing.
  const dup = engine.submit('cheese');
  assert.equal(dup.type, 'duplicate');
  assert.equal(engine.getState().players[1].score, 0);
  engine.destroy();
});

test('wrong classic answer never takes score below zero', async () => {
  const q = BUILTIN_QUESTIONS[0];
  const engine = new GameEngine({questions:[q],language:'en',settings:{roundTime:30,reducedMotion:true,aiDifficulty:'medium'},onChange:()=>{},onEvent:()=>{}});
  engine.start('classic-local',['A','B']);
  await new Promise(r=>setTimeout(r,120));
  const result = engine.submit('definitely not on board');
  assert.equal(result.type,'wrong');
  assert.equal(engine.getState().players[0].score,0);
  engine.destroy();
});

test('traditional mode reaches steal after three strikes', async () => {
  const q = BUILTIN_QUESTIONS.find(q => q.id === 'food_burger_002');
  const engine = new GameEngine({questions:[q],language:'en',settings:{roundTime:90,reducedMotion:true,aiDifficulty:'medium'},onChange:()=>{},onEvent:()=>{}});
  engine.start('traditional',['Blue','Gold']);
  await new Promise(r=>setTimeout(r,120));
  assert.equal(engine.getState().phase,'faceoff_a');
  engine.submit('cheese');
  assert.equal(engine.getState().phase,'faceoff_b');
  engine.submit('not an answer');
  assert.equal(engine.getState().phase,'play_pass');
  engine.choosePlayPass('play');
  assert.equal(engine.getState().phase,'team_play');
  engine.submit('wrong one');
  engine.submit('wrong two');
  engine.submit('wrong three');
  assert.equal(engine.getState().phase,'steal');
  assert.equal(engine.getState().strikes,3);
  engine.destroy();
});

test('fast money blocks equivalent Player 2 answer and preserves question index', () => {
  const engine = new GameEngine({questions:BUILTIN_QUESTIONS.slice(0,8),language:'en',settings:{roundTime:60,reducedMotion:true,aiDifficulty:'medium'},onChange:()=>{},onEvent:()=>{}});
  engine.start('fastmoney',['A','B']);
  for(let i=0;i<5;i++) {
    const s=engine.getState();
    engine.submit(s.question.answers[0].text.en);
  }
  assert.equal(engine.getState().phase,'fm_transition');
  engine.startSecondFastMoney();
  const firstQ=engine.getState().question;
  const same=engine.state.fastMoney.responses[0][0].display;
  const result=engine.submit(same);
  assert.equal(result.type,'duplicate-opponent');
  assert.equal(engine.getState().fastMoney.index,0);
  engine.submit(firstQ.answers[1].text.en);
  assert.equal(engine.getState().fastMoney.index,1);
  engine.destroy();
});
