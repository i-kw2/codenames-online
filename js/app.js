import { BUILTIN_QUESTIONS, validateQuestionBank, cloneQuestions } from './questions.js';
import { loadSettings, saveSettings, loadStats, saveStats, loadCustomQuestions, saveCustomQuestions } from './storage.js';
import { setLanguage, applyDocumentLanguage, t, getLanguage } from './i18n.js';
import { AudioManager } from './audio.js';
import { GameEngine } from './game.js';
import { UI } from './ui.js';
import { OnlineClient } from './online.js';

const root = document.getElementById('app');
const ui = new UI(root);

const app = {
  screen: 'home',
  previousScreen: 'home',
  settings: loadSettings(),
  stats: loadStats(),
  selectedMode: null,
  customQuestions: loadCustomQuestions(),
  allQuestions: [],
  customQuestionIds: new Set(),
  questionFilter: { search:'', category:'' },
  game: null,
  gameState: null,
  lastSetup: null,
  gameRecorded: false,
  online: { status:'idle', players:[] }
};

function rebuildQuestions() {
  const built = cloneQuestions(BUILTIN_QUESTIONS);
  const custom = Array.isArray(app.customQuestions) ? app.customQuestions : [];
  const errors = validateQuestionBank([...built, ...custom]);
  if (errors.length) {
    console.warn('Custom question validation errors:', errors);
    // Keep built-ins playable even if stored custom data is corrupted.
    app.customQuestions = custom.filter(q => validateQuestionBank([q]).length === 0 && !built.some(b => b.id === q.id));
    saveCustomQuestions(app.customQuestions);
  }
  app.allQuestions = [...built, ...app.customQuestions];
  app.customQuestionIds = new Set(app.customQuestions.map(q=>q.id));
}

setLanguage(app.settings.language);
applyDocumentLanguage(app.settings.language);
rebuildQuestions();

const audio = new AudioManager(() => app.settings);

function handleGameEvent(type, payload) {
  const soundMap = { correct:'correct', wrong:'wrong', strike:'wrong', duplicate:'click', empty:'click', countdown:'countdown', gameOver:'win', stealSuccess:'win', stealFailed:'wrong' };
  if (soundMap[type]) audio.beep(soundMap[type]);
  if (['correct','wrong','strike','duplicate','empty','tryAnother','aiThinking','stealSuccess','stealFailed'].includes(type)) setTimeout(() => ui.feedback(type,payload), 25);
}

function onGameChange(state) {
  app.gameState = state;
  if (state?.phase === 'game_over' && !app.gameRecorded) recordGame(state);
  render();
}

function makeEngine() {
  app.game?.destroy();
  app.game = new GameEngine({ questions: app.allQuestions, language:getLanguage(), settings:app.settings, onChange:onGameChange, onEvent:handleGameEvent });
}

const onlineClient = new OnlineClient({
  onLobby(data) {
    app.online = { status:'room', ...data };
    if (app.screen !== 'game') app.screen = 'online';
    render();
  },
  onGameState(state) {
    app.selectedMode = 'online';
    app.gameState = state;
    app.screen = 'game';
    if (state.phase === 'game_over' && !app.gameRecorded) recordGame(state);
    render();
  },
  onFeedback(data) { setTimeout(() => ui.feedback(data.type, data), 50); if (data.type==='correct') audio.beep('correct'); else if (data.type==='wrong') audio.beep('wrong'); },
  onError(message) { ui.toast(message,'error'); },
  onDisconnect() { ui.toast(t('reconnecting'),'warning'); }
});

function navigate(screen) {
  app.previousScreen = app.screen;
  app.screen = screen;
  render();
}

function back() {
  if (app.screen === 'modes') return navigate('home');
  if (['setup','online'].includes(app.screen)) return navigate('modes');
  if (['settings','stats','howto','questions'].includes(app.screen)) return navigate(app.previousScreen === 'game' ? 'game' : 'home');
  navigate('home');
}

function render() { ui.render(app, app.gameState); }

function startLocalGame(mode, p1, p2) {
  makeEngine();
  app.selectedMode = mode;
  app.lastSetup = { mode, names:[p1,p2] };
  app.gameRecorded = false;
  app.screen = 'game';
  app.game.start(mode, [p1,p2]);
}

function recordGame(state) {
  app.gameRecorded = true;
  const player = state.players?.[0];
  if (!player) return;
  app.stats.gamesPlayed += 1;
  app.stats.totalScore += Number(player.score)||0;
  app.stats.highestScore = Math.max(app.stats.highestScore, Number(player.score)||0);
  app.stats.correct += Number(player.correct)||0;
  app.stats.wrong += Number(player.wrong)||0;
  if (state.winner === 0) app.stats.wins += 1;
  else if (state.winner === 1) app.stats.losses += 1;
  saveStats(app.stats);
}

function setAppLanguage(lang) {
  app.settings.language = lang === 'ar' ? 'ar' : 'en';
  saveSettings(app.settings);
  setLanguage(app.settings.language);
  applyDocumentLanguage(app.settings.language);
  app.game?.setLanguage(app.settings.language);
  render();
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function showConfirm(message, onYes) {
  const modal = document.getElementById('modal-root');
  modal.innerHTML = `<div class="modal-backdrop"><section class="modal-card compact" role="dialog" aria-modal="true"><p id="confirm-message"></p><div class="modal-actions"><button class="game-btn" data-action="modal-close">${t('cancel')}</button><button class="game-btn danger" data-action="confirm-yes">${t('continue')}</button></div></section></div>`;
  document.getElementById('confirm-message').textContent = message;
  app.pendingConfirm = onYes;
}

function saveCustomQuestionFromForm(form) {
  const rows = [...form.querySelectorAll('[data-answer-row]')];
  const originalId = form.elements.namedItem('originalId').value.trim();
  const id = form.elements.namedItem('id').value.trim();
  const question = {
    id,
    category: form.elements.namedItem('category').value.trim(),
    question: { en:form.elements.namedItem('qEn').value.trim(), ar:form.elements.namedItem('qAr').value.trim() },
    answers: rows.map((row,i) => {
      const by = name => row.querySelector(`[name="${name}"]`).value;
      const en = by('aEn').trim(), ar = by('aAr').trim();
      return {
        id: `${id}_a${i+1}`,
        text:{ en, ar },
        points:Number(by('aPoints')),
        aliases:{
          en:[en, ...by('aAliasesEn').split(',').map(x=>x.trim()).filter(Boolean)],
          ar:[ar, ...by('aAliasesAr').split(',').map(x=>x.trim()).filter(Boolean)]
        }
      };
    })
  };
  const validation = validateQuestionBank([question]);
  if (rows.length < 3 || rows.length > 8) validation.push('A question must contain 3-8 answers.');
  const conflict = app.allQuestions.find(q => q.id === id && q.id !== originalId);
  if (conflict) validation.push(`Question ID "${id}" already exists.`);
  if (validation.length) { ui.toast(validation[0],'error'); return false; }
  if (originalId) app.customQuestions = app.customQuestions.filter(q=>q.id!==originalId);
  app.customQuestions.push(question);
  saveCustomQuestions(app.customQuestions);
  rebuildQuestions();
  ui.closeModal();
  render();
  ui.toast(t('saved'),'success');
  return true;
}

root.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  audio.beep('click');
  try {
    if (action === 'play') navigate('modes');
    else if (action === 'back') back();
    else if (action === 'home') { app.game?.destroy(); onlineClient.leaveRoom(); app.gameState=null; navigate('home'); }
    else if (action === 'settings') navigate('settings');
    else if (action === 'stats') navigate('stats');
    else if (action === 'howto') navigate('howto');
    else if (action === 'questions') navigate('questions');
    else if (action === 'toggle-language') setAppLanguage(getLanguage()==='ar'?'en':'ar');
    else if (action === 'select-mode') {
      app.selectedMode = button.dataset.mode;
      if (app.selectedMode === 'online') navigate('online'); else navigate('setup');
    }
    else if (action === 'pause') app.game?.pause();
    else if (action === 'resume') app.game?.resume();
    else if (action === 'quit-match') showConfirm(t('confirmQuit'),()=>{ app.game?.destroy(); app.gameState=null; navigate('home'); });
    else if (action === 'next-round') { if (app.selectedMode==='online') onlineClient.nextRound(); else app.game?.nextRound(); }
    else if (action === 'play-pass') app.game?.choosePlayPass(button.dataset.choice);
    else if (action === 'fm-player2') app.game?.startSecondFastMoney();
    else if (action === 'fm-finish') app.game?.finishFastMoneyResults();
    else if (action === 'rematch') {
      if (app.selectedMode==='online') { navigate('online'); }
      else if (app.lastSetup) startLocalGame(app.lastSetup.mode,...app.lastSetup.names);
    }
    else if (action === 'vk-key') {
      const input = document.getElementById('answer-input'); if (!input) return;
      const key = button.dataset.key;
      if (key==='backspace') input.value=input.value.slice(0,-1); else if (key==='space') input.value+=' '; else input.value+=key;
      input.focus();
    }
    else if (action === 'reset-stats') { app.stats={gamesPlayed:0,wins:0,losses:0,highestScore:0,totalScore:0,correct:0,wrong:0}; saveStats(app.stats); ui.toast(t('saved'),'success'); }
    else if (action === 'add-question') ui.showQuestionEditor();
    else if (action === 'edit-question') ui.showQuestionEditor(app.customQuestions.find(q=>q.id===button.dataset.id));
    else if (action === 'duplicate-question') {
      const source=app.allQuestions.find(q=>q.id===button.dataset.id); if (!source) return;
      const copy=JSON.parse(JSON.stringify(source)); copy.id=`${source.id}_custom_${Date.now().toString().slice(-5)}`; copy.answers.forEach((a,i)=>a.id=`${copy.id}_a${i+1}`); ui.showQuestionEditor(copy);
    }
    else if (action === 'delete-question') showConfirm(t('confirmDelete'),()=>{ app.customQuestions=app.customQuestions.filter(q=>q.id!==button.dataset.id); saveCustomQuestions(app.customQuestions); rebuildQuestions(); render(); });
    else if (action === 'import-json') ui.showImport();
    else if (action === 'export-json') { downloadJSON('survey-showdown-questions.json',app.allQuestions); ui.toast(t('exportDone'),'success'); }
    else if (action === 'modal-close') { ui.closeModal(); app.pendingConfirm=null; }
    else if (action === 'confirm-yes') { const fn=app.pendingConfirm; app.pendingConfirm=null; ui.closeModal(); fn?.(); }
    else if (action === 'editor-add-answer') {
      const container=document.getElementById('editor-answers'); if (container.children.length>=8) return ui.toast('Maximum 8 answers.','warning');
      container.insertAdjacentHTML('beforeend',ui.answerEditorRow({text:{en:'',ar:''},points:10,aliases:{en:[],ar:[]}},container.children.length));
    }
    else if (action === 'editor-delete-answer') { const rows=document.querySelectorAll('[data-answer-row]'); if (rows.length<=3) return ui.toast('Minimum 3 answers.','warning'); button.closest('[data-answer-row]').remove(); }
    else if (action === 'create-room') {
      const response=await onlineClient.createRoom(app.settings.playerName,getLanguage()); app.online={status:'room',roomCode:response.roomCode,players:[],isHost:true}; render();
    }
    else if (action === 'copy-room') { await navigator.clipboard.writeText(app.online.roomCode); ui.toast(t('copied'),'success'); }
    else if (action === 'copy-link') { const url=new URL(location.href); url.searchParams.set('room',app.online.roomCode); await navigator.clipboard.writeText(url.toString()); ui.toast(t('copied'),'success'); }
    else if (action === 'start-online') { app.gameRecorded=false; onlineClient.startMatch(); }
    else if (action === 'leave-room') { onlineClient.leaveRoom(); app.online={status:'idle',players:[]}; render(); }
  } catch (error) { console.error(error); ui.toast(error.message || t('error'),'error'); }
});

root.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  try {
    if (form.dataset.form === 'setup') {
      const p1=form.p1.value.trim(), p2=form.p2.value.trim();
      app.settings.playerName=p1; app.settings.roundTime=Number(form.roundTime?.value||app.settings.roundTime); if (form.difficulty) app.settings.aiDifficulty=form.difficulty.value; saveSettings(app.settings);
      startLocalGame(app.selectedMode,p1,p2);
    } else if (form.dataset.form === 'answer') {
      const input=form.answer; const value=input.value.trim();
      if (app.selectedMode==='online') { if (!value) return ui.feedback('empty'); onlineClient.submitGuess(value); input.value=''; }
      else { const result=app.game?.submit(value); if (result && !['empty','duplicate','duplicate-opponent','ignored'].includes(result.type)) input.value=''; }
      input.focus();
    } else if (form.dataset.form === 'settings') {
      app.settings={...app.settings,language:form.language.value,sound:form.sound.checked,virtualKeyboard:form.virtualKeyboard.checked,reducedMotion:form.reducedMotion.checked,roundTime:Number(form.roundTime.value),aiDifficulty:form.aiDifficulty.value};
      saveSettings(app.settings); setAppLanguage(app.settings.language); ui.toast(t('saved'),'success');
    } else if (form.dataset.form === 'question-editor') saveCustomQuestionFromForm(form);
    else if (form.dataset.form === 'import-json') {
      let parsed; try { parsed=JSON.parse(form.json.value); } catch { return ui.toast('Invalid JSON syntax.','error'); }
      if (!Array.isArray(parsed)) return ui.toast('JSON must be an array of questions.','error');
      const errors=validateQuestionBank(parsed); const existing=new Set(BUILTIN_QUESTIONS.map(q=>q.id));
      for (const q of parsed) if (existing.has(q.id)) errors.push(`Question ID "${q.id}" conflicts with a built-in question.`);
      if (errors.length) return ui.toast(errors[0],'error');
      app.customQuestions=parsed; saveCustomQuestions(app.customQuestions); rebuildQuestions(); ui.closeModal(); render(); ui.toast(t('importDone'),'success');
    } else if (form.dataset.form === 'join-room') {
      const code=form.roomCode.value.trim().toUpperCase(); const name=form.name.value.trim(); app.settings.playerName=name; saveSettings(app.settings); await onlineClient.joinRoom(code,name);
    }
  } catch (error) { console.error(error); ui.toast(error.message||t('error'),'error'); }
});

root.addEventListener('input', event => {
  if (event.target.id === 'qb-search') { app.questionFilter.search=event.target.value; render(); const input=document.getElementById('qb-search'); input?.focus(); input?.setSelectionRange(input.value.length,input.value.length); }
  if (event.target.name === 'roomCode') event.target.value=event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
});
root.addEventListener('change', event => { if (event.target.id==='qb-category') { app.questionFilter.category=event.target.value; render(); } });

document.getElementById('modal-root').addEventListener('click', event => {
  const button=event.target.closest('[data-action]'); if (!button) return;
  // Re-dispatch through root logic for modal actions.
  if (button.dataset.action==='modal-close') { ui.closeModal(); app.pendingConfirm=null; }
  else if (button.dataset.action==='confirm-yes') { const fn=app.pendingConfirm; app.pendingConfirm=null; ui.closeModal(); fn?.(); }
  else if (button.dataset.action==='editor-add-answer') { const container=document.getElementById('editor-answers'); if (container.children.length<8) container.insertAdjacentHTML('beforeend',ui.answerEditorRow({text:{en:'',ar:''},points:10,aliases:{en:[],ar:[]}},container.children.length)); }
  else if (button.dataset.action==='editor-delete-answer') { const rows=document.querySelectorAll('[data-answer-row]'); if (rows.length>3) button.closest('[data-answer-row]').remove(); }
});
document.getElementById('modal-root').addEventListener('submit', event => {
  event.preventDefault(); const form=event.target;
  if (form.dataset.form==='question-editor') saveCustomQuestionFromForm(form);
  else if (form.dataset.form==='import-json') {
    let parsed; try { parsed=JSON.parse(form.json.value); } catch { return ui.toast('Invalid JSON syntax.','error'); }
    if (!Array.isArray(parsed)) return ui.toast('JSON must be an array.','error');
    const errors=validateQuestionBank(parsed); const builtIds=new Set(BUILTIN_QUESTIONS.map(q=>q.id)); for(const q of parsed) if(builtIds.has(q.id)) errors.push(`Question ID "${q.id}" conflicts with a built-in question.`);
    if(errors.length) return ui.toast(errors[0],'error'); app.customQuestions=parsed; saveCustomQuestions(parsed); rebuildQuestions(); ui.closeModal(); render(); ui.toast(t('importDone'),'success');
  }
});

// Deep-link to an online room when served by the Node server.
const roomFromUrl = new URL(location.href).searchParams.get('room');
if (roomFromUrl) { app.screen='online'; app.online.prefillRoom=roomFromUrl.toUpperCase(); }
render();
