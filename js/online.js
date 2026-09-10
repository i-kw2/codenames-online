import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js';
import {
  getDatabase, ref, get, set, update, remove, onValue, push, onDisconnect, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js';

const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ACTION_TIMEOUT_MS = 12000;

const runtime = {
  configured: false,
  app: null,
  auth: null,
  db: null,
  user: null,
  uid: null,
  roomCode: null,
  roomName: null,
  inRoom: false,
  isHost: false,
  roomStatus: null,
  players: {},
  player: null,
  publicGame: null,
  secretMap: null,
  secretReady: false,
  roomSettings: { cardLanguage: 'both', strictClues: true, expertRules: false },
  unsubs: [],
  secretUnsub: null,
  actionUnsub: null,
  ownPlayerUnsub: null,
  hostUidUnsub: null,
  presenceUnsub: null,
  presenceDisconnects: [],
  processingIds: new Set(),
  actionQueue: Promise.resolve(),
  disconnecting: false
};

const dom = {};
let CN = null;

function waitForCore() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const candidate = window.Codenames;
      if (candidate && candidate.Game && candidate.UI && candidate.Utils && candidate.DEFAULT_WORDS) {
        CN = candidate;
        resolve(candidate);
        return;
      }
      if (Date.now() - started > 6000) {
        reject(new Error('Codenames core modules did not initialize.'));
        return;
      }
      setTimeout(tick, 30);
    };
    tick();
  });
}

function cacheDom() {
  [
    'onlineHomeSection','lobbySection','firebaseConnectionBadge','firebaseSetupWarning','hostRoomNameInput','hostNameInput','createRoomBtn',
    'joinNameInput','joinRoomCodeInput','joinRoomBtn','onlineHomeMessage','playLocalBtn','lobbyRoomCode','lobbyIdentity',
    'copyInviteBtn','leaveRoomBtn','inviteLinkValue','lobbyPlayerCount','hostOnlyHint','onlinePlayersList','hostLobbyControls',
    'onlineCardLanguageSelect','onlineStrictCluesCheckbox','onlineExpertRulesCheckbox','onlineRandomTeamsBtn','onlineRandomSpiesBtn',
    'lobbyValidationMessage','onlineStartGameBtn','onlineGameBar','onlineGameRoomCode','onlineGameIdentity','onlineHostStatus',
    'copyInviteInGameBtn'
  ].forEach((id) => { dom[id] = document.getElementById(id); });
}

function setMessage(element, text, isError = true) {
  if (!element) return;
  element.hidden = !text;
  element.textContent = text || '';
  element.classList.toggle('error-message', Boolean(isError));
}

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 30);
}

function normalizeRoomCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function configLooksValid(config) {
  if (!config || typeof config !== 'object') return false;
  const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId'];
  return required.every((key) => {
    const value = String(config[key] || '');
    return value && !value.includes('YOUR_') && !value.includes('YOUR-PROJECT') && !value.includes('YOUR_PROJECT');
  });
}

function setConnectionBadge(text, connected) {
  if (!dom.firebaseConnectionBadge) return;
  dom.firebaseConnectionBadge.textContent = text;
  dom.firebaseConnectionBadge.classList.toggle('online', Boolean(connected));
  dom.firebaseConnectionBadge.classList.toggle('offline', !connected);
}

function generateRoomCode(length = 6) {
  const bytes = new Uint8Array(length);
  if (crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (byte) => ROOM_CHARS[byte % ROOM_CHARS.length]).join('');
}

function inviteUrl(code = runtime.roomCode) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('room', code || '');
  return url.toString();
}

async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

function saveName(name) {
  try { localStorage.setItem('codenames-online-name', name); } catch (_) { /* optional */ }
}

function loadName() {
  try { return localStorage.getItem('codenames-online-name') || ''; } catch (_) { return ''; }
}

function updateUrlRoom(code) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set('room', code);
  else url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

function updateUIContext() {
  if (!CN || !CN.UI) return;
  CN.UI.setOnlineContext({
    inRoom: runtime.inRoom,
    roomStatus: runtime.roomStatus,
    isHost: runtime.isHost,
    uid: runtime.uid,
    player: runtime.player,
    secretReady: runtime.secretReady
  });
}

function renderShell() {
  if (!dom.onlineHomeSection) return;
  if (!runtime.inRoom) {
    dom.onlineHomeSection.hidden = false;
    dom.lobbySection.hidden = true;
    dom.onlineGameBar.hidden = true;
    updateUIContext();
    return;
  }

  const inLobby = runtime.roomStatus === 'lobby';
  dom.onlineHomeSection.hidden = true;
  dom.lobbySection.hidden = !inLobby;
  dom.onlineGameBar.hidden = runtime.roomStatus !== 'playing';

  if (runtime.roomCode) {
    const roomLabel = runtime.roomName ? `${runtime.roomName} · ${runtime.roomCode}` : runtime.roomCode;
    dom.lobbyRoomCode.textContent = roomLabel;
    dom.onlineGameRoomCode.textContent = roomLabel;
    dom.inviteLinkValue.textContent = inviteUrl();
  }

  const name = runtime.player ? runtime.player.name : 'Player';
  const hostText = runtime.isHost ? ' · 👑 HOST' : '';
  const roleText = runtime.player && runtime.player.team !== 'unassigned'
    ? ` · ${runtime.player.team.toUpperCase()} · ${runtime.player.role}`
    : '';
  dom.lobbyIdentity.textContent = `${name}${hostText}${roleText}`;
  dom.onlineGameIdentity.textContent = `${name}${hostText}${roleText}`;
  const host = Object.values(runtime.players).find((p) => p && p.isHost);
  dom.onlineHostStatus.textContent = host
    ? `Host: ${host.name} · ${host.online ? '🟢 online' : '🔴 offline — game actions are paused until host reconnects'}`
    : 'Host status unavailable';

  renderLobbyPlayers();
  renderHostControls();
  updateUIContext();
}

function renderHostControls() {
  if (!dom.hostLobbyControls) return;
  dom.hostLobbyControls.hidden = !runtime.isHost;
  dom.hostOnlyHint.textContent = runtime.isHost ? 'You control teams, roles and Start Game.' : 'Waiting for the host to start.';
  dom.onlineCardLanguageSelect.value = runtime.roomSettings.cardLanguage || 'both';
  dom.onlineStrictCluesCheckbox.checked = runtime.roomSettings.strictClues !== false;
  dom.onlineExpertRulesCheckbox.checked = Boolean(runtime.roomSettings.expertRules);
}

function playerTeamLabel(team) {
  if (team === 'red') return '🔴 Red';
  if (team === 'blue') return '🔵 Blue';
  if (team === 'spectator') return '👁️ Spectator';
  return '⚪ Unassigned';
}

function renderLobbyPlayers() {
  if (!dom.onlinePlayersList) return;
  dom.onlinePlayersList.replaceChildren();
  const players = Object.values(runtime.players || {}).filter(Boolean).sort((a, b) => {
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    return Number(a.joinedAt || 0) - Number(b.joinedAt || 0);
  });
  dom.lobbyPlayerCount.textContent = String(players.length);

  players.forEach((player) => {
    const row = document.createElement('div');
    row.className = 'online-player-row';
    row.dataset.uid = player.uid;

    const identity = document.createElement('div');
    identity.className = 'online-player-identity';
    const name = document.createElement('strong');
    name.textContent = player.name || 'Player';
    const meta = document.createElement('span');
    meta.className = 'small muted';
    meta.textContent = `${player.online ? '🟢' : '⚫'} ${player.isHost ? '👑 HOST · ' : ''}${playerTeamLabel(player.team)} · ${player.role}`;
    identity.append(name, meta);
    row.appendChild(identity);

    if (runtime.isHost) {
      const team = document.createElement('select');
      team.dataset.action = 'team';
      [['unassigned','Unassigned'],['red','Red'],['blue','Blue'],['spectator','Spectator']].forEach(([value, label]) => {
        const option = document.createElement('option'); option.value = value; option.textContent = label; team.appendChild(option);
      });
      team.value = player.team || 'unassigned';
      row.appendChild(team);

      const role = document.createElement('select');
      role.dataset.action = 'role';
      [['operative','Operative'],['spymaster','Spymaster'],['spectator','Spectator']].forEach(([value, label]) => {
        const option = document.createElement('option'); option.value = value; option.textContent = label; role.appendChild(option);
      });
      role.value = player.role || 'operative';
      role.disabled = player.team === 'unassigned';
      row.appendChild(role);

      if (player.uid !== runtime.uid) {
        const kick = document.createElement('button');
        kick.type = 'button';
        kick.className = 'button danger small-button';
        kick.dataset.action = 'kick';
        kick.textContent = 'Kick';
        row.appendChild(kick);
      }
    }

    dom.onlinePlayersList.appendChild(row);
  });
}

async function ensureAuth() {
  if (!runtime.configured || !runtime.auth) throw Object.assign(new Error('Firebase is not configured.'), { code: 'FIREBASE_NOT_CONFIGURED' });
  if (runtime.auth.currentUser) {
    runtime.user = runtime.auth.currentUser;
    runtime.uid = runtime.user.uid;
    return runtime.user;
  }
  const credential = await signInAnonymously(runtime.auth);
  runtime.user = credential.user;
  runtime.uid = credential.user.uid;
  return credential.user;
}

function roomPath(extra = '') {
  if (!runtime.roomCode) throw new Error('No active room.');
  return `rooms/${runtime.roomCode}${extra ? `/${extra}` : ''}`;
}

function roomRef(extra = '') {
  return ref(runtime.db, roomPath(extra));
}

function cleanupListeners() {
  runtime.unsubs.splice(0).forEach((unsub) => { try { unsub(); } catch (_) { /* ignore */ } });
  if (runtime.secretUnsub) { try { runtime.secretUnsub(); } catch (_) {} runtime.secretUnsub = null; }
  if (runtime.actionUnsub) { try { runtime.actionUnsub(); } catch (_) {} runtime.actionUnsub = null; }
  if (runtime.ownPlayerUnsub) { try { runtime.ownPlayerUnsub(); } catch (_) {} runtime.ownPlayerUnsub = null; }
  if (runtime.hostUidUnsub) { try { runtime.hostUidUnsub(); } catch (_) {} runtime.hostUidUnsub = null; }
  runtime.processingIds.clear();
}

async function cancelPresenceDisconnects() {
  const items = runtime.presenceDisconnects.splice(0);
  await Promise.all(items.map(async (item) => { try { await item.cancel(); } catch (_) { /* ignore */ } }));
}

function resetRoomRuntime() {
  cleanupListeners();
  runtime.roomCode = null;
  runtime.roomName = null;
  runtime.inRoom = false;
  runtime.isHost = false;
  runtime.roomStatus = null;
  runtime.players = {};
  runtime.player = null;
  runtime.publicGame = null;
  runtime.secretMap = null;
  runtime.secretReady = false;
  runtime.roomSettings = { cardLanguage: 'both', strictClues: true, expertRules: false };
  runtime.disconnecting = false;
  updateUrlRoom(null);
  updateUIContext();
  renderShell();
}

async function setupPresence() {
  if (!runtime.uid || !runtime.roomCode) return;
  const onlineRef = roomRef(`players/${runtime.uid}/online`);
  const lastSeenRef = roomRef(`players/${runtime.uid}/lastSeen`);
  const connectedRef = ref(runtime.db, '.info/connected');

  if (runtime.presenceUnsub) { runtime.presenceUnsub(); runtime.presenceUnsub = null; }
  runtime.presenceUnsub = onValue(connectedRef, async (snap) => {
    const connected = snap.val() === true;
    setConnectionBadge(connected ? 'Firebase: connected' : 'Firebase: reconnecting…', connected);
    if (!connected || !runtime.inRoom) return;
    try {
      const offOnline = onDisconnect(onlineRef);
      const offSeen = onDisconnect(lastSeenRef);
      runtime.presenceDisconnects.push(offOnline, offSeen);
      await offOnline.set(false);
      await offSeen.set(serverTimestamp());
      await set(onlineRef, true);
      await set(lastSeenRef, serverTimestamp());
    } catch (error) {
      console.warn('Presence setup failed', error);
    }
  });
  runtime.unsubs.push(() => { if (runtime.presenceUnsub) runtime.presenceUnsub(); runtime.presenceUnsub = null; });
}

function mergeGameForThisClient() {
  if (!runtime.publicGame || !CN) return;
  const mayHaveSecret = runtime.isHost || (runtime.player && runtime.player.role === 'spymaster');
  const merged = mayHaveSecret && runtime.secretMap
    ? CN.Game.applySecretRoles(runtime.publicGame, runtime.secretMap)
    : CN.Utils.deepClone(runtime.publicGame);
  CN.Game.replaceState(merged, true);
}

function ensureSecretListener() {
  if (!runtime.inRoom) return;
  const shouldRead = runtime.isHost || (runtime.player && runtime.player.role === 'spymaster');
  if (!shouldRead) {
    if (runtime.secretUnsub) { runtime.secretUnsub(); runtime.secretUnsub = null; }
    runtime.secretMap = null;
    runtime.secretReady = false;
    mergeGameForThisClient();
    updateUIContext();
    return;
  }
  if (runtime.secretUnsub) return;
  runtime.secretUnsub = onValue(roomRef('secret/roleMap'), (snap) => {
    runtime.secretMap = snap.val() || null;
    runtime.secretReady = Boolean(runtime.secretMap);
    mergeGameForThisClient();
    updateUIContext();
    maybeStartActionProcessor();
  }, (error) => {
    runtime.secretMap = null;
    runtime.secretReady = false;
    console.warn('Secret key read denied/unavailable.', error);
    updateUIContext();
  });
}

function attachRoomListeners() {
  cleanupListeners();
  runtime.inRoom = true;
  CN.UI.setRuntimeMode('online');
  updateUrlRoom(runtime.roomCode);

  runtime.hostUidUnsub = onValue(roomRef('hostUid'), (snap) => {
    const hostUid = snap.val();
    runtime.isHost = Boolean(hostUid && hostUid === runtime.uid);
    ensureSecretListener();
    renderShell();
    maybeStartActionProcessor();
  });

  runtime.unsubs.push(onValue(roomRef('status'), (snap) => {
    if (!snap.exists()) {
      if (!runtime.disconnecting) handleRoomGone('The room was closed or no longer exists.');
      return;
    }
    runtime.roomStatus = snap.val();
    renderShell();
    maybeStartActionProcessor();
  }, (error) => {
    if (!runtime.disconnecting) handleRoomGone(error.code === 'PERMISSION_DENIED' ? 'You no longer have access to this room.' : error.message);
  }));

  runtime.unsubs.push(onValue(roomRef('settings'), (snap) => {
    runtime.roomSettings = Object.assign({ cardLanguage: 'both', strictClues: true, expertRules: false }, snap.val() || {});
    renderHostControls();
  }));

  runtime.unsubs.push(onValue(roomRef('roomName'), (snap) => {
    runtime.roomName = snap.val() || null;
    renderShell();
  }));

  runtime.unsubs.push(onValue(roomRef('players'), (snap) => {
    runtime.players = snap.val() || {};
    Object.keys(runtime.players).forEach((uid) => { if (runtime.players[uid]) runtime.players[uid].uid = uid; });
    runtime.player = runtime.players[runtime.uid] || null;
    if (!runtime.player && !runtime.disconnecting) {
      handleRoomGone('You were removed from the room by the host.');
      return;
    }
    ensureSecretListener();
    renderShell();
    maybeStartActionProcessor();
  }, (error) => {
    if (!runtime.disconnecting) console.warn('Players listener stopped:', error);
  }));

  runtime.unsubs.push(onValue(roomRef('publicGame'), (snap) => {
    runtime.publicGame = snap.val() || null;
    if (runtime.publicGame) mergeGameForThisClient();
    maybeStartActionProcessor();
  }));

  runtime.ownPlayerUnsub = onValue(roomRef(`players/${runtime.uid}`), (snap) => {
    if (!snap.exists() && runtime.inRoom && !runtime.disconnecting) handleRoomGone('You were removed from the room.');
  });

  setupPresence();
  renderShell();
}

function handleRoomGone(message) {
  runtime.disconnecting = true;
  cleanupListeners();
  runtime.inRoom = false;
  runtime.roomStatus = null;
  runtime.players = {};
  runtime.player = null;
  runtime.publicGame = null;
  runtime.secretMap = null;
  runtime.secretReady = false;
  runtime.roomCode = null;
  updateUrlRoom(null);
  CN.Game.newGameToSetup();
  CN.UI.setRuntimeMode('menu');
  renderShell();
  setMessage(dom.onlineHomeMessage, message || 'Room closed.', true);
  runtime.disconnecting = false;
}

async function createRoom() {
  setMessage(dom.onlineHomeMessage, '');
  const roomName = normalizeName(dom.hostRoomNameInput.value);
  const name = normalizeName(dom.hostNameInput.value);
  if (!roomName) { setMessage(dom.onlineHomeMessage, 'اكتب اسم الغرفة أولاً / Enter a room name first.'); return; }
  if (roomName.length < 2) { setMessage(dom.onlineHomeMessage, 'اسم الغرفة قصير جداً / Room name is too short.'); return; }
  if (!name) { setMessage(dom.onlineHomeMessage, 'اكتب اسمك أولاً / Enter your name first.'); return; }
  if (!runtime.configured) { setMessage(dom.onlineHomeMessage, 'Firebase غير مربوط. افتح SETUP-ONLINE.md واتبع الخطوات.'); return; }
  dom.createRoomBtn.disabled = true;
  try {
    await ensureAuth();
    saveName(name);
    let created = false;
    let lastError = null;
    for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
      const code = generateRoomCode(6);
      const candidate = ref(runtime.db, `rooms/${code}`);
      const room = {
        roomName,
        hostUid: runtime.uid,
        status: 'lobby',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: { cardLanguage: 'both', strictClues: true, expertRules: false },
        players: {
          [runtime.uid]: {
            uid: runtime.uid,
            name,
            team: 'unassigned',
            role: 'operative',
            isHost: true,
            online: true,
            joinedAt: serverTimestamp(),
            lastSeen: serverTimestamp()
          }
        }
      };
      try {
        await set(candidate, room);
        runtime.roomCode = code;
        runtime.roomName = roomName;
        runtime.isHost = true;
        created = true;
      } catch (error) { lastError = error; }
    }
    if (!created) throw lastError || new Error('Could not create a unique room.');
    attachRoomListeners();
  } catch (error) {
    console.error(error);
    setMessage(dom.onlineHomeMessage, friendlyFirebaseError(error));
  } finally {
    dom.createRoomBtn.disabled = false;
  }
}

async function joinRoom() {
  setMessage(dom.onlineHomeMessage, '');
  const name = normalizeName(dom.joinNameInput.value);
  const code = normalizeRoomCode(dom.joinRoomCodeInput.value);
  if (!name) { setMessage(dom.onlineHomeMessage, 'اكتب اسمك أولاً / Enter your name first.'); return; }
  if (code.length < 5) { setMessage(dom.onlineHomeMessage, 'اكتب Room Code صحيح.'); return; }
  if (!runtime.configured) { setMessage(dom.onlineHomeMessage, 'Firebase غير مربوط. افتح SETUP-ONLINE.md واتبع الخطوات.'); return; }
  dom.joinRoomBtn.disabled = true;
  try {
    await ensureAuth();
    saveName(name);
    runtime.roomCode = code;
    const myRef = roomRef(`players/${runtime.uid}`);
    const existing = await get(myRef);
    if (existing.exists()) {
      await set(roomRef(`players/${runtime.uid}/name`), name);
      await set(roomRef(`players/${runtime.uid}/online`), true);
      await set(roomRef(`players/${runtime.uid}/lastSeen`), serverTimestamp());
    } else {
      await set(myRef, {
        uid: runtime.uid,
        name,
        team: 'unassigned',
        role: 'operative',
        isHost: false,
        online: true,
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      });
    }
    attachRoomListeners();
  } catch (error) {
    console.error(error);
    runtime.roomCode = null;
    setMessage(dom.onlineHomeMessage, friendlyFirebaseError(error, 'Room code is wrong, room is closed, or the game already started.'));
  } finally {
    dom.joinRoomBtn.disabled = false;
  }
}

function friendlyFirebaseError(error, fallback) {
  const code = String(error && error.code || '');
  if (code.includes('operation-not-allowed')) return 'فعّل Anonymous Authentication في Firebase أولاً.';
  if (code.includes('permission-denied') || code.includes('PERMISSION_DENIED')) return fallback || 'Permission denied. تأكد من firebase-rules.json ومن Room Code.';
  if (code.includes('network')) return 'تعذر الاتصال بـ Firebase. تأكد من الإنترنت.';
  return fallback || (error && error.message) || 'Firebase error';
}

async function leaveRoom() {
  if (!runtime.inRoom) return;
  if (runtime.isHost) {
    if (!window.confirm('أنت الـHost. إغلاق الغرفة سيخرج الجميع. Close the room?')) return;
    runtime.disconnecting = true;
    try {
      await cancelPresenceDisconnects();
      await remove(roomRef());
    } catch (error) { console.warn(error); }
    resetRoomRuntime();
    CN.Game.newGameToSetup();
    CN.UI.setRuntimeMode('menu');
    return;
  }

  if (!window.confirm('Leave this room?')) return;
  runtime.disconnecting = true;
  try {
    await cancelPresenceDisconnects();
    if (runtime.roomStatus === 'lobby') await remove(roomRef(`players/${runtime.uid}`));
    else {
      await set(roomRef(`players/${runtime.uid}/online`), false);
      await set(roomRef(`players/${runtime.uid}/lastSeen`), serverTimestamp());
    }
  } catch (error) { console.warn(error); }
  resetRoomRuntime();
  CN.Game.newGameToSetup();
  CN.UI.setRuntimeMode('menu');
}

async function updatePlayerAssignment(uid, field, value) {
  if (!runtime.isHost || runtime.roomStatus !== 'lobby') return;
  const player = runtime.players[uid];
  if (!player) return;
  if (field === 'team') {
    await set(roomRef(`players/${uid}/team`), value);
    if (value === 'spectator') await set(roomRef(`players/${uid}/role`), 'spectator');
    else if (player.role === 'spectator' || value === 'unassigned') await set(roomRef(`players/${uid}/role`), 'operative');
    return;
  }
  if (field === 'role') {
    if (value === 'spectator') {
      await update(roomRef(), { [`players/${uid}/team`]: 'spectator', [`players/${uid}/role`]: 'spectator' });
      return;
    }
    if (player.team === 'spectator') return;
    if (value === 'spymaster') {
      if (player.team === 'unassigned') return;
      const updates = {};
      Object.values(runtime.players).forEach((other) => {
        if (other.uid !== uid && other.team === player.team && other.role === 'spymaster') {
          updates[`players/${other.uid}/role`] = 'operative';
        }
      });
      updates[`players/${uid}/role`] = 'spymaster';
      await update(roomRef(), updates);
    } else await set(roomRef(`players/${uid}/role`), 'operative');
  }
}

async function kickPlayer(uid) {
  if (!runtime.isHost || uid === runtime.uid) return;
  const player = runtime.players[uid];
  if (!player) return;
  if (!window.confirm(`Kick ${player.name}?`)) return;
  await remove(roomRef(`players/${uid}`));
}

async function randomizeTeams() {
  if (!runtime.isHost) return;
  const players = Object.values(runtime.players).map((p) => ({ ...p, id: p.uid }));
  const activeCount = players.filter((p) => p.team !== 'spectator' && p.role !== 'spectator').length;
  if (activeCount < 4) { setMessage(dom.lobbyValidationMessage, 'Need at least 4 active players (spectators do not count).'); return; }
  let next = CN.Game.randomiseTeams(players);
  next = CN.Game.randomiseSpymasters(next);
  const changes = {};
  next.forEach((p) => {
    changes[`players/${p.uid}/team`] = p.team;
    changes[`players/${p.uid}/role`] = p.role;
  });
  await update(roomRef(), changes);
  setMessage(dom.lobbyValidationMessage, '');
}

async function randomizeSpymasters() {
  if (!runtime.isHost) return;
  const players = Object.values(runtime.players).map((p) => ({ ...p, id: p.uid }));
  const active = players.filter((p) => p.team !== 'spectator' && p.role !== 'spectator');
  if (active.some((p) => !['red', 'blue'].includes(p.team))) {
    setMessage(dom.lobbyValidationMessage, 'Assign every active player to Red or Blue first.');
    return;
  }
  const next = CN.Game.randomiseSpymasters(players);
  const changes = {};
  next.forEach((p) => { changes[`players/${p.uid}/role`] = p.role; });
  await update(roomRef(), changes);
  setMessage(dom.lobbyValidationMessage, '');
}

async function saveHostLobbySettings() {
  if (!runtime.isHost) return;
  const settings = {
    cardLanguage: dom.onlineCardLanguageSelect.value,
    strictClues: dom.onlineStrictCluesCheckbox.checked,
    expertRules: dom.onlineExpertRulesCheckbox.checked
  };
  await set(roomRef('settings'), settings);
}

async function startOnlineGame() {
  if (!runtime.isHost || runtime.roomStatus !== 'lobby') return;
  setMessage(dom.lobbyValidationMessage, '');
  const players = Object.values(runtime.players).map((p) => ({ id: p.uid, name: p.name, team: p.team, role: p.role }));
  const validation = CN.Game.validatePlayers(players);
  if (!validation.valid) {
    setMessage(dom.lobbyValidationMessage, `Cannot start: ${validation.errors.join(', ')}. Use Randomize Teams for an automatic valid setup.`);
    return;
  }
  const settings = {
    uiLanguage: CN.I18n.getLanguage(),
    cardLanguage: dom.onlineCardLanguageSelect.value,
    strictClues: dom.onlineStrictCluesCheckbox.checked,
    expertRules: dom.onlineExpertRulesCheckbox.checked,
    wordSource: 'default'
  };
  dom.onlineStartGameBtn.disabled = true;
  try {
    await set(roomRef('settings'), {
      cardLanguage: settings.cardLanguage,
      strictClues: settings.strictClues,
      expertRules: settings.expertRules
    });
    const started = CN.Game.startGame({ players, settings, wordPool: CN.DEFAULT_WORDS });
    if (!started.ok) throw new Error(started.errors ? started.errors.join(', ') : started.code);
    runtime.secretMap = CN.Game.getSecretRoleMap();
    runtime.secretReady = true;
    runtime.publicGame = CN.Game.getPublicSnapshot();
    await update(roomRef(), {
      status: 'playing',
      publicGame: runtime.publicGame,
      secret: { roleMap: runtime.secretMap },
      actions: null,
      actionResults: null,
      updatedAt: serverTimestamp()
    });
    mergeGameForThisClient();
    maybeStartActionProcessor();
  } catch (error) {
    console.error(error);
    setMessage(dom.lobbyValidationMessage, error.message || 'Could not start game.');
  } finally {
    dom.onlineStartGameBtn.disabled = false;
  }
}

function authorizeAction(action) {
  const player = runtime.players[action.uid];
  const state = CN.Game.getState();
  if (!player) return { ok: false, code: 'PLAYER_NOT_IN_ROOM' };
  if (action.type === 'resetRound' || action.type === 'returnLobby') {
    return action.uid === runtime.uid && runtime.isHost ? { ok: true, player } : { ok: false, code: 'HOST_ONLY' };
  }
  if (runtime.roomStatus !== 'playing') return { ok: false, code: 'ROOM_NOT_PLAYING' };
  if (action.type === 'guess' || action.type === 'endTurn' || action.type === 'candidateLog' || action.type === 'toggleCandidate' || action.type === 'clearCandidates' || action.type === 'commitCandidate') {
    if (player.role !== 'operative' || player.team !== state.currentTeam) return { ok: false, code: 'NOT_CURRENT_OPERATIVE' };
  }
  if (action.type === 'submitClue') {
    if (player.role !== 'spymaster' || player.team !== state.currentTeam) return { ok: false, code: 'NOT_CURRENT_SPYMASTER' };
  }
  if (action.type === 'challengeClue' || action.type === 'resolveChallenge') {
    if (player.role !== 'spymaster' || player.team === state.currentTeam) return { ok: false, code: 'NOT_OPPOSING_SPYMASTER' };
  }
  if (action.type === 'resolvePenalty') {
    if (player.role !== 'spymaster' || !state.invalidCluePenalty || player.team !== state.invalidCluePenalty.team) return { ok: false, code: 'NOT_PENALTY_SPYMASTER' };
  }
  return { ok: true, player };
}

function compactResult(result) {
  const value = result || { ok: false, code: 'NO_RESULT' };
  return {
    ok: Boolean(value.ok),
    code: value.code || null,
    validation: value.validation ? {
      valid: value.validation.valid,
      errors: value.validation.errors || [],
      warnings: value.validation.warnings || []
    } : null,
    at: Date.now()
  };
}

async function broadcastHostState(includeSecret = false) {
  runtime.publicGame = CN.Game.getPublicSnapshot();
  const patch = { publicGame: runtime.publicGame, updatedAt: serverTimestamp() };
  if (includeSecret) {
    runtime.secretMap = CN.Game.getSecretRoleMap();
    runtime.secretReady = true;
    patch.secret = { roleMap: runtime.secretMap };
  }
  await update(roomRef(), patch);
}

async function processOneAction(actionId, action) {
  if (!action || runtime.processingIds.has(actionId)) return;
  runtime.processingIds.add(actionId);
  const actionRef = roomRef(`actions/${actionId}`);
  const resultRef = roomRef(`actionResults/${action.uid}/${actionId}`);
  try {
    if (!runtime.publicGame || !runtime.secretMap) throw Object.assign(new Error('Host state not ready'), { code: 'HOST_STATE_NOT_READY' });
    const authoritative = CN.Game.applySecretRoles(runtime.publicGame, runtime.secretMap);
    CN.Game.replaceState(authoritative, false);
    const authz = authorizeAction(action);
    let result = authz;

    if (authz.ok) {
      const payload = action.payload || {};
      switch (action.type) {
        case 'guess': result = CN.Game.handleGuess(payload.cardId); break;
        case 'toggleCandidate': result = CN.Game.toggleCandidate(payload.cardId, action.uid); break;
        case 'clearCandidates': result = CN.Game.clearCandidates(action.uid, 'MANUAL'); break;
        case 'commitCandidate': result = CN.Game.commitCandidate(payload.cardId, action.uid); break;
        case 'candidateLog': CN.Game.logEvent(payload.eventType || 'CANDIDATE_EVENT', Object.assign({ playerId: action.uid, team: authz.player.team }, payload.data || {})); result = { ok: true }; break;
        case 'submitClue': result = CN.Game.submitClue(payload); break;
        case 'endTurn': result = CN.Game.endTurn('VOLUNTARY'); break;
        case 'challengeClue': result = CN.Game.challengeClue(); break;
        case 'resolveChallenge': result = CN.Game.resolveClueChallenge(payload.decision); break;
        case 'resolvePenalty': result = CN.Game.resolveInvalidCluePenalty(payload.cardId || null); break;
        case 'resetRound': {
          result = CN.Game.resetGame({ wordPool: CN.DEFAULT_WORDS });
          if (result.ok) await broadcastHostState(true);
          break;
        }
        case 'returnLobby': {
          CN.Game.newGameToSetup();
          runtime.publicGame = null;
          runtime.secretMap = null;
          runtime.secretReady = false;
          await update(roomRef(), {
            status: 'lobby',
            publicGame: null,
            secret: null,
            actions: null,
            actionResults: null,
            updatedAt: serverTimestamp()
          });
          result = { ok: true };
          break;
        }
        default: result = { ok: false, code: 'UNKNOWN_ACTION' };
      }

      if (result.ok && !['resetRound', 'returnLobby'].includes(action.type)) await broadcastHostState(false);
    }

    await set(resultRef, compactResult(result));
    if (action.type !== 'returnLobby') await remove(actionRef);
  } catch (error) {
    console.error('Host action processing failed', error);
    try { await set(resultRef, compactResult({ ok: false, code: error.code || 'HOST_PROCESSING_ERROR' })); } catch (_) { /* ignored */ }
    try { await remove(actionRef); } catch (_) { /* ignored */ }
  } finally {
    runtime.processingIds.delete(actionId);
  }
}

function maybeStartActionProcessor() {
  const ready = runtime.isHost && runtime.inRoom && runtime.roomStatus === 'playing' && runtime.publicGame && runtime.secretMap;
  if (!ready) {
    if (runtime.actionUnsub) { runtime.actionUnsub(); runtime.actionUnsub = null; }
    return;
  }
  if (runtime.actionUnsub) return;
  runtime.actionUnsub = onValue(roomRef('actions'), (snap) => {
    const actions = snap.val() || {};
    Object.entries(actions).forEach(([id, action]) => {
      if (runtime.processingIds.has(id)) return;
      runtime.actionQueue = runtime.actionQueue.then(() => processOneAction(id, action));
    });
  }, (error) => console.warn('Host action listener error', error));
}

async function requestAction(type, payload) {
  if (!runtime.inRoom || runtime.roomStatus !== 'playing') return { ok: false, code: 'ROOM_NOT_PLAYING' };
  await ensureAuth();
  const actionRef = push(roomRef('actions'));
  const actionId = actionRef.key;
  const resultRef = roomRef(`actionResults/${runtime.uid}/${actionId}`);

  return new Promise(async (resolve) => {
    let settled = false;
    let unsub = null;
    const finish = async (result) => {
      if (settled) return;
      settled = true;
      if (unsub) unsub();
      clearTimeout(timer);
      try { await remove(resultRef); } catch (_) { /* host may have closed the room */ }
      resolve(result || { ok: false, code: 'NO_RESULT' });
    };
    const timer = setTimeout(() => finish({ ok: false, code: 'HOST_TIMEOUT' }), ACTION_TIMEOUT_MS);
    unsub = onValue(resultRef, (snap) => { if (snap.exists()) finish(snap.val()); }, () => finish({ ok: false, code: 'RESULT_READ_FAILED' }));
    try {
      await set(actionRef, { uid: runtime.uid, type, payload: payload || {}, createdAt: serverTimestamp() });
    } catch (error) {
      await finish({ ok: false, code: error.code || 'ACTION_WRITE_FAILED' });
    }
  });
}

function bindEvents() {
  dom.createRoomBtn.addEventListener('click', createRoom);
  dom.joinRoomBtn.addEventListener('click', joinRoom);
  dom.joinRoomCodeInput.addEventListener('input', () => { dom.joinRoomCodeInput.value = normalizeRoomCode(dom.joinRoomCodeInput.value); });
  dom.joinRoomCodeInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') joinRoom(); });
  dom.joinNameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') joinRoom(); });
  dom.hostRoomNameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') dom.hostNameInput.focus(); });
  dom.hostNameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') createRoom(); });
  dom.copyInviteBtn.addEventListener('click', async () => { await copyText(inviteUrl()); dom.copyInviteBtn.textContent = 'Copied ✓'; setTimeout(() => { dom.copyInviteBtn.textContent = 'Copy Invite Link'; }, 1500); });
  dom.copyInviteInGameBtn.addEventListener('click', async () => { await copyText(inviteUrl()); dom.copyInviteInGameBtn.textContent = 'Copied ✓'; setTimeout(() => { dom.copyInviteInGameBtn.textContent = 'Copy Invite'; }, 1500); });
  dom.leaveRoomBtn.addEventListener('click', leaveRoom);

  dom.onlinePlayersList.addEventListener('change', async (event) => {
    const row = event.target.closest('[data-uid]');
    if (!row || !runtime.isHost) return;
    const action = event.target.dataset.action;
    if (action === 'team' || action === 'role') {
      try { await updatePlayerAssignment(row.dataset.uid, action, event.target.value); }
      catch (error) { setMessage(dom.lobbyValidationMessage, friendlyFirebaseError(error)); }
    }
  });
  dom.onlinePlayersList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="kick"]');
    const row = event.target.closest('[data-uid]');
    if (button && row) await kickPlayer(row.dataset.uid);
  });

  dom.onlineRandomTeamsBtn.addEventListener('click', () => randomizeTeams().catch((e) => setMessage(dom.lobbyValidationMessage, e.message)));
  dom.onlineRandomSpiesBtn.addEventListener('click', () => randomizeSpymasters().catch((e) => setMessage(dom.lobbyValidationMessage, e.message)));
  dom.onlineStartGameBtn.addEventListener('click', startOnlineGame);
  [dom.onlineCardLanguageSelect, dom.onlineStrictCluesCheckbox, dom.onlineExpertRulesCheckbox].forEach((el) => {
    el.addEventListener('change', () => saveHostLobbySettings().catch((e) => setMessage(dom.lobbyValidationMessage, e.message)));
  });
}

function initializeFirebase() {
  const config = window.CODENAMES_FIREBASE_CONFIG;
  runtime.configured = configLooksValid(config);
  if (!runtime.configured) {
    dom.firebaseSetupWarning.hidden = false;
    dom.createRoomBtn.disabled = true;
    dom.joinRoomBtn.disabled = true;
    setConnectionBadge('Firebase: setup required', false);
    return;
  }
  runtime.app = initializeApp(config);
  runtime.auth = getAuth(runtime.app);
  runtime.db = getDatabase(runtime.app);
  dom.firebaseSetupWarning.hidden = true;
  dom.createRoomBtn.disabled = false;
  dom.joinRoomBtn.disabled = false;
  const connectedRef = ref(runtime.db, '.info/connected');
  runtime.unsubs.push(onValue(connectedRef, (snap) => {
    const connected = snap.val() === true;
    setConnectionBadge(connected ? 'Firebase: connected' : 'Firebase: connecting…', connected);
  }));
}

async function boot() {
  try {
    await waitForCore();
    cacheDom();
    bindEvents();
    const savedName = loadName();
    if (savedName) { dom.hostNameInput.value = savedName; dom.joinNameInput.value = savedName; }
    const roomParam = normalizeRoomCode(new URL(window.location.href).searchParams.get('room'));
    if (roomParam) dom.joinRoomCodeInput.value = roomParam;
    CN.UI.setRuntimeMode('menu');
    initializeFirebase();
    renderShell();
    window.Codenames.Online = {
      requestAction,
      createRoom,
      joinRoom,
      leaveRoom,
      getContext: () => ({
        configured: runtime.configured,
        roomCode: runtime.roomCode,
        roomName: runtime.roomName,
        inRoom: runtime.inRoom,
        isHost: runtime.isHost,
        roomStatus: runtime.roomStatus,
        uid: runtime.uid,
        player: runtime.player
      })
    };
    window.dispatchEvent(new CustomEvent('codenames-online-ready'));
  } catch (error) {
    console.error('Online module failed to initialize:', error);
    if (dom.firebaseSetupWarning) {
      dom.firebaseSetupWarning.hidden = false;
      dom.firebaseSetupWarning.textContent = `Online module error: ${error.message}`;
    }
  }
}

boot();
