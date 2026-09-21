(function () {
  'use strict';
  const H = window.TestHarness;
  const CN = window.Codenames;
  const G = CN.Game;
  const I = CN.I18n;

  const validPlayers = [
    { id:'p1',name:'A',team:'red',role:'spymaster' },
    { id:'p2',name:'B',team:'red',role:'operative' },
    { id:'p3',name:'C',team:'blue',role:'spymaster' },
    { id:'p4',name:'D',team:'blue',role:'operative' }
  ];

  H.test('Arabic UI sets lang=ar and dir=rtl', () => {
    I.setLanguage('ar');
    H.equal(document.documentElement.lang, 'ar'); H.equal(document.documentElement.dir, 'rtl');
  });

  H.test('English UI sets lang=en and dir=ltr', () => {
    I.setLanguage('en');
    H.equal(document.documentElement.lang, 'en'); H.equal(document.documentElement.dir, 'ltr');
  });

  H.test('changing UI language does not reset active round', () => {
    G.startGame({ players: validPlayers, wordPool: CN.DEFAULT_WORDS, startingTeam: 'red', settings: { uiLanguage:'ar', cardLanguage:'both' } });
    const roundId = G.getState().roundId;
    I.setLanguage('en');
    G.updateSettings({ uiLanguage:'en' });
    H.equal(G.getState().roundId, roundId); H.equal(G.getState().status, 'clue');
  });

  H.test('card language change is blocked during active round', () => {
    const before = G.getState().settings.cardLanguage;
    G.updateSettings({ cardLanguage: before === 'both' ? 'en' : 'both' });
    H.equal(G.getState().settings.cardLanguage, before);
  });

  H.test('HTML-like imported words are stored as text data, not executed', () => {
    const lines = Array.from({length:25},(_,i)=>`<img src=x onerror=alert(${i})>|Word${i}`);
    const result = G.importCustomWords(lines.join('\n'), 'txt');
    H.ok(result.valid);
    H.ok(result.words[0].ar.includes('<img'));
  });
})();
