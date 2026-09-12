(function () {
  'use strict';
  const H = window.TestHarness;
  const G = window.Codenames.Game;

  function countRoles(roles) {
    return roles.reduce((acc, role) => { acc[role] = (acc[role] || 0) + 1; return acc; }, {});
  }

  function baseState(overrides) {
    const state = G.__test.blankState({ uiLanguage: 'en', cardLanguage: 'both', strictClues: true, expertRules: true });
    Object.assign(state, {
      status: 'guessing', currentTeam: 'red', startingTeam: 'red', remaining: { red: 2, blue: 2 },
      currentClue: { text: 'test', mode: 'number', number: 2 }, guessesMade: 0, maxGuesses: 3,
      board: [
        { id: 'r1', wordId: 'r1', ar: 'أحمر1', en: 'RedOne', role: 'red', revealed: false },
        { id: 'r2', wordId: 'r2', ar: 'أحمر2', en: 'RedTwo', role: 'red', revealed: false },
        { id: 'b1', wordId: 'b1', ar: 'أزرق1', en: 'BlueOne', role: 'blue', revealed: false },
        { id: 'b2', wordId: 'b2', ar: 'أزرق2', en: 'BlueTwo', role: 'blue', revealed: false },
        { id: 'n1', wordId: 'n1', ar: 'محايد', en: 'Neutral', role: 'neutral', revealed: false },
        { id: 'a1', wordId: 'a1', ar: 'قاتل', en: 'Assassin', role: 'assassin', revealed: false }
      ]
    });
    if (overrides) Object.assign(state, overrides);
    return state;
  }

  H.test('assignRoles(red) = 9 red / 8 blue / 7 neutral / 1 assassin', () => {
    const counts = countRoles(G.assignRoles('red'));
    H.equal(counts.red, 9); H.equal(counts.blue, 8); H.equal(counts.neutral, 7); H.equal(counts.assassin, 1);
  });

  H.test('assignRoles(blue) = 9 blue / 8 red / 7 neutral / 1 assassin', () => {
    const counts = countRoles(G.assignRoles('blue'));
    H.equal(counts.blue, 9); H.equal(counts.red, 8); H.equal(counts.neutral, 7); H.equal(counts.assassin, 1);
  });

  H.test('shuffle preserves count and elements', () => {
    const source = Array.from({ length: 30 }, (_, i) => i);
    const out = window.Codenames.Utils.shuffle(source);
    H.equal(out.length, source.length);
    H.deepEqual(out.slice().sort((a,b)=>a-b), source);
  });

  H.test('createBoard returns 25 unique word ids', () => {
    const board = G.createBoard(window.Codenames.DEFAULT_WORDS, 'red');
    H.equal(board.length, 25);
    H.equal(new Set(board.map((c) => c.wordId)).size, 25);
  });

  H.test('own agent guess continues current turn', () => {
    G.__test.replaceState(baseState());
    const result = G.handleGuess('r1');
    H.ok(result.ok); H.equal(G.getState().currentTeam, 'red'); H.equal(G.getState().status, 'guessing'); H.equal(G.getState().remaining.red, 1);
  });

  H.test('normal clue n=2 allows exactly n+1 = 3 guesses', () => {
    const state = baseState({ remaining: { red: 4, blue: 2 } });
    state.board.unshift({ id:'r3',wordId:'r3',ar:'ر3',en:'R3',role:'red',revealed:false }, { id:'r4',wordId:'r4',ar:'ر4',en:'R4',role:'red',revealed:false });
    G.__test.replaceState(state);
    H.ok(G.handleGuess('r1').ok);
    H.ok(G.handleGuess('r2').ok);
    H.ok(G.handleGuess('r3').ok);
    H.equal(G.getState().currentTeam, 'blue');
    H.equal(G.getState().status, 'clue');
  });

  H.test('neutral guess ends turn', () => {
    G.__test.replaceState(baseState());
    G.handleGuess('n1');
    H.equal(G.getState().currentTeam, 'blue'); H.equal(G.getState().status, 'clue');
  });

  H.test('opponent agent guess decrements opponent and ends turn', () => {
    G.__test.replaceState(baseState());
    G.handleGuess('b1');
    H.equal(G.getState().remaining.blue, 1); H.equal(G.getState().currentTeam, 'blue');
  });

  H.test('guessing opponent final agent immediately wins for opponent', () => {
    const state = baseState({ remaining: { red: 2, blue: 1 } });
    G.__test.replaceState(state);
    G.handleGuess('b1');
    H.equal(G.getState().status, 'ended'); H.equal(G.getState().winner, 'blue'); H.equal(G.getState().endReason, 'ALL_AGENTS_FOUND');
  });

  H.test('assassin immediately ends game for opposing team', () => {
    G.__test.replaceState(baseState());
    G.handleGuess('a1');
    H.equal(G.getState().status, 'ended'); H.equal(G.getState().winner, 'blue'); H.equal(G.getState().endReason, 'ASSASSIN');
  });

  H.test('revealed card cannot be revealed twice', () => {
    G.__test.replaceState(baseState());
    H.ok(G.handleGuess('r1').ok);
    const second = G.handleGuess('r1');
    H.ok(!second.ok); H.equal(second.code, 'ALREADY_REVEALED'); H.equal(G.getState().remaining.red, 1);
  });

  H.test('endGame winner cannot be overwritten', () => {
    G.__test.replaceState(baseState());
    G.endGame('red', 'TEST');
    G.endGame('blue', 'SECOND_TEST');
    H.equal(G.getState().winner, 'red'); H.equal(G.getState().endReason, 'TEST');
  });

  H.test('strict clue rejects visible English board word', () => {
    const state = baseState(); state.status = 'clue'; G.__test.replaceState(state);
    const result = G.validateClue('RedOne', 1, 'en');
    H.ok(!result.valid); H.ok(result.errors.includes('CLUE_MATCHES_VISIBLE_WORD'));
  });

  H.test('strict bilingual clue rejects visible Arabic translation', () => {
    const state = baseState(); state.status = 'clue'; G.__test.replaceState(state);
    const result = G.validateClue('أحمر1', 1, 'ar');
    H.ok(!result.valid); H.ok(result.errors.includes('CLUE_MATCHES_VISIBLE_WORD'));
  });

  H.test('valid structural clue is accepted', () => {
    const state = baseState(); state.status = 'clue'; G.__test.replaceState(state);
    const result = G.validateClue('Music', 2, 'en');
    H.ok(result.valid);
  });

  H.test('custom word import rejects fewer than 25', () => {
    const raw = Array.from({length:24},(_,i)=>`كلمة${i}|Word${i}`).join('\n');
    const result = G.importCustomWords(raw, 'txt');
    H.ok(!result.valid); H.equal(result.acceptedCount, 24);
  });

  H.test('custom word import accepts 25 valid pairs', () => {
    const raw = Array.from({length:25},(_,i)=>`كلمة${i}|Word${i}`).join('\n');
    const result = G.importCustomWords(raw, 'txt');
    H.ok(result.valid); H.equal(result.acceptedCount, 25);
  });

  H.test('custom word import detects duplicates', () => {
    const lines = Array.from({length:25},(_,i)=>`كلمة${i}|Word${i}`); lines.push('كلمة0|Other');
    const result = G.importCustomWords(lines.join('\n'), 'txt');
    H.ok(result.valid); H.ok(result.rejectedCount >= 1);
  });


  H.test('expert Unlimited clue produces infinite guess limit', () => {
    const state = baseState(); state.status = 'clue'; state.currentClue = null; state.settings.expertRules = true; G.__test.replaceState(state);
    const result = G.submitClue({ text: 'Galaxy', mode: 'unlimited' });
    H.ok(result.ok); H.equal(G.getState().maxGuesses, Infinity); H.equal(G.getState().status, 'guessing');
  });

  H.test('expert Zero clue produces infinite guess limit', () => {
    const state = baseState(); state.status = 'clue'; state.currentClue = null; state.settings.expertRules = true; G.__test.replaceState(state);
    const result = G.submitClue({ text: 'Galaxy', mode: 'zero' });
    H.ok(result.ok); H.equal(G.getState().maxGuesses, Infinity); H.equal(G.getState().currentClue.number, 0);
  });

  H.test('allowed clue challenge cannot be challenged twice', () => {
    const state = baseState(); state.status = 'clue'; state.currentClue = null; G.__test.replaceState(state);
    H.ok(G.submitClue({ text: 'Galaxy', mode: 'number', number: 1 }).ok);
    H.ok(G.challengeClue().ok);
    H.ok(G.resolveClueChallenge('allow').ok);
    const second = G.challengeClue();
    H.ok(!second.ok); H.equal(second.code, 'CHALLENGE_NOT_AVAILABLE');
  });

  H.test('rejected clue enters penalty and opponent may reveal own agent', () => {
    const state = baseState(); state.status = 'clue'; state.currentClue = null; G.__test.replaceState(state);
    H.ok(G.submitClue({ text: 'Galaxy', mode: 'number', number: 1 }).ok);
    H.ok(G.challengeClue().ok);
    H.ok(G.resolveClueChallenge('reject').ok);
    H.equal(G.getState().status, 'penalty'); H.equal(G.getState().invalidCluePenalty.team, 'blue');
    const result = G.resolveInvalidCluePenalty('b1');
    H.ok(result.ok); H.equal(G.getState().remaining.blue, 1); H.equal(G.getState().currentTeam, 'blue'); H.equal(G.getState().status, 'clue');
  });
  H.test('operative must guess once before voluntarily ending the turn (V2 rule)', () => {
    G.__test.replaceState(baseState());
    const result = G.endTurn('VOLUNTARY');
    H.ok(!result.ok);
    H.equal(result.code, 'MUST_GUESS_FIRST');
    H.equal(G.getState().currentTeam, 'red');
    H.equal(G.getState().status, 'guessing');
  });

  H.test('direct card guess resolves immediately without candidate state', () => {
    G.__test.replaceState(baseState());
    H.ok(!Object.prototype.hasOwnProperty.call(G.getState(), 'candidateSelection'));
    const result = G.handleGuess('r1');
    H.ok(result.ok);
    H.equal(G.getState().remaining.red, 1);
    H.equal(G.getState().currentTeam, 'red');
  });

  H.test('legacy candidateSelection is discarded when loading a snapshot', () => {
    const state = baseState();
    state.candidateSelection = { team: 'red', cardIds: ['r1'] };
    G.replaceState(state, false);
    H.ok(!Object.prototype.hasOwnProperty.call(G.getState(), 'candidateSelection'));
  });

  H.test('public online snapshot hides unrevealed roles', () => {
    const state = baseState();
    state.board.find((c) => c.id === 'n1').revealed = true;
    G.__test.replaceState(state);
    const publicState = G.getPublicSnapshot();
    H.equal(publicState.board.find((c) => c.id === 'r1').role, null);
    H.equal(publicState.board.find((c) => c.id === 'n1').role, 'neutral');
  });

  H.test('secret role map restores spymaster board without changing card ids', () => {
    const state = baseState();
    G.__test.replaceState(state);
    const roles = G.getSecretRoleMap();
    const publicState = G.getPublicSnapshot();
    const merged = G.applySecretRoles(publicState, roles);
    H.equal(merged.board.find((c) => c.id === 'r1').role, 'red');
    H.equal(merged.board.find((c) => c.id === 'a1').role, 'assassin');
  });

  H.test('online snapshot serializes Infinity and restores it for expert clue', () => {
    const state = baseState();
    state.currentClue = { text: 'Galaxy', mode: 'unlimited', number: null };
    state.maxGuesses = Infinity;
    G.__test.replaceState(state);
    const publicState = G.getPublicSnapshot();
    H.equal(publicState.maxGuesses, null);
    G.replaceState(publicState, false);
    H.equal(G.getState().maxGuesses, Infinity);
  });

  H.test('spectators do not count toward the four active players', () => {
    const players = [
      { id:'p1',name:'A',team:'red',role:'spymaster' },
      { id:'p2',name:'B',team:'red',role:'operative' },
      { id:'p3',name:'C',team:'blue',role:'spymaster' },
      { id:'p4',name:'D',team:'blue',role:'operative' },
      { id:'p5',name:'E',team:'spectator',role:'spectator' }
    ];
    const result = G.validatePlayers(players);
    H.ok(result.valid); H.equal(result.players.filter((p) => p.role === 'spectator').length, 1);
  });

  H.test('team randomisation preserves spectators outside red and blue', () => {
    const players = [
      { id:'p1',team:'red',role:'operative' }, { id:'p2',team:'red',role:'operative' },
      { id:'p3',team:'blue',role:'operative' }, { id:'p4',team:'blue',role:'operative' },
      { id:'p5',team:'spectator',role:'spectator' }
    ];
    const next = G.randomiseTeams(players);
    const spectator = next.find((p) => p.id === 'p5');
    H.equal(spectator.team, 'spectator'); H.equal(spectator.role, 'spectator');
  });

  H.test('card reveal log includes clue, bilingual word, outcome and remaining counts', () => {
    const state = baseState();
    G.__test.replaceState(state);
    G.handleGuess('r1');
    const entry = G.getState().logs.find((item) => item.type === 'CARD_REVEALED');
    H.ok(entry); H.equal(entry.payload.en, 'RedOne'); H.equal(entry.payload.ar, 'أحمر1');
    H.equal(entry.payload.outcome, 'correct'); H.equal(entry.payload.clue.text, 'test'); H.equal(entry.payload.remaining.red, 1);
  });

})();

// V11 original-image assignment tests / اختبارات توزيع الصور الأصلية في V11
(function () {
  'use strict';
  const H = window.TestHarness;
  const G = window.Codenames.Game;

  H.test('V11 createBoard assigns all 25 unique original reveal images', () => {
    const board = G.createBoard(window.Codenames.DEFAULT_WORDS, 'red');
    const images = board.map((card) => card.revealImage);
    H.equal(images.length, 25);
    H.equal(new Set(images).size, 25);
    H.equal(new Set(G.REVEAL_CARD_IMAGES).size, 25);
    images.forEach((image) => H.ok(G.REVEAL_CARD_IMAGES.includes(image)));
  });

  H.test('V11 new boards reshuffle original reveal image positions', () => {
    const first = G.createBoard(window.Codenames.DEFAULT_WORDS, 'red').map((card) => card.revealImage);
    let changed = false;
    for (let attempt = 0; attempt < 5 && !changed; attempt += 1) {
      const next = G.createBoard(window.Codenames.DEFAULT_WORDS, 'red').map((card) => card.revealImage);
      changed = next.some((image, index) => image !== first[index]);
    }
    H.ok(changed, 'Expected at least one image position to change across newly generated boards');
  });
})();
