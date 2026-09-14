import { storage } from './storage.js';

function randomToken() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class OnlineClient {
  constructor({ onLobby=()=>{}, onGameState=()=>{}, onFeedback=()=>{}, onError=()=>{}, onDisconnect=()=>{} } = {}) {
    this.socket = null;
    this.roomCode = null;
    this.isHost = false;
    this.token = storage.get('onlineToken', null) || randomToken();
    storage.set('onlineToken', this.token);
    this.onLobby = onLobby;
    this.onGameState = onGameState;
    this.onFeedback = onFeedback;
    this.onError = onError;
    this.onDisconnect = onDisconnect;
  }

  async ensureConnected() {
    if (this.socket?.connected) return this.socket;
    if (!window.io) await this._loadSocketIo();
    if (!window.io) throw new Error('Socket.IO client is unavailable. Run the project with npm start for online mode.');
    if (!this.socket) {
      this.socket = window.io({ autoConnect: false });
      this.socket.on('roomState', data => {
        this.roomCode = data.roomCode;
        this.isHost = data.hostToken === this.token;
        this.onLobby({ ...data, isHost: this.isHost });
      });
      this.socket.on('gameState', data => this.onGameState(this._hydrateGameState(data)));
      this.socket.on('feedback', data => this.onFeedback(data));
      this.socket.on('serverError', data => this.onError(data?.message || 'Online error'));
      this.socket.on('disconnect', () => this.onDisconnect());
      this.socket.on('connect', () => {
        if (this.roomCode) this.socket.emit('rejoinRoom', { roomCode:this.roomCode, token:this.token });
      });
    }
    if (!this.socket.connected) this.socket.connect();
    await new Promise((resolve, reject) => {
      if (this.socket.connected) return resolve();
      const timer = setTimeout(() => reject(new Error('Could not connect to the online server.')), 5000);
      this.socket.once('connect', () => { clearTimeout(timer); resolve(); });
      this.socket.once('connect_error', err => { clearTimeout(timer); reject(err); });
    });
    return this.socket;
  }

  async createRoom(name, language) {
    const socket = await this.ensureConnected();
    return new Promise((resolve, reject) => {
      socket.emit('createRoom', { name, language, token:this.token }, response => {
        if (!response?.ok) return reject(new Error(response?.message || 'Could not create room.'));
        this.roomCode = response.roomCode;
        this.isHost = true;
        resolve(response);
      });
    });
  }

  async joinRoom(roomCode, name) {
    const socket = await this.ensureConnected();
    return new Promise((resolve, reject) => {
      socket.emit('joinRoom', { roomCode, name, token:this.token }, response => {
        if (!response?.ok) return reject(new Error(response?.message || 'Could not join room.'));
        this.roomCode = response.roomCode;
        this.isHost = false;
        resolve(response);
      });
    });
  }

  startMatch() { this.socket?.emit('startMatch', { roomCode:this.roomCode, token:this.token }); }
  submitGuess(answer) { this.socket?.emit('submitGuess', { roomCode:this.roomCode, token:this.token, answer }); }
  nextRound() { this.socket?.emit('nextRound', { roomCode:this.roomCode, token:this.token }); }
  leaveRoom() {
    if (this.socket && this.roomCode) this.socket.emit('leaveRoom', { roomCode:this.roomCode, token:this.token });
    this.roomCode = null;
    this.isHost = false;
  }

  _hydrateGameState(data) {
    return { ...data, revealedIds: new Set(data.revealedIds || []) };
  }

  _loadSocketIo() {
    return new Promise(resolve => {
      const existing = document.querySelector('script[data-socketio-client]');
      if (existing) { existing.addEventListener('load', resolve, { once:true }); existing.addEventListener('error', resolve, { once:true }); return; }
      const script = document.createElement('script');
      script.src = '/socket.io/socket.io.js';
      script.dataset.socketioClient = '1';
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }
}
