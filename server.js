import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { ONLINE_QUESTIONS } from './server/onlineQuestions.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.get('/', (_req,res)=>res.sendFile(new URL('./index.html', import.meta.url).pathname));
app.use('/css', express.static(new URL('./css', import.meta.url).pathname));
app.use('/js', express.static(new URL('./js', import.meta.url).pathname));
app.use('/assets', express.static(new URL('./assets', import.meta.url).pathname));

const rooms = new Map();
const clean = s => String(s??'').trim().slice(0,60);
const normalize = (s,lang='en') => {
  let x=clean(s).toLowerCase();
  if(lang==='ar') x=x.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/ـ/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي');
  return x.replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
};
const matchAnswer = (q,input,lang) => q.answers.find(a => ['en','ar'].some(l => [a.text[l],...(a.aliases[l]||[])].some(v=>normalize(v,l)===normalize(input,l)))) || null;
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const code = () => { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let out=''; do{out='';for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];}while(rooms.has(out)); return out; };

function roomLobby(room){ return { roomCode:room.code, hostToken:room.hostToken, players:room.players.map(p=>({name:p.name,connected:p.connected})) }; }
function broadcastLobby(room){ io.to(room.code).emit('roomState',roomLobby(room)); }
function publicState(room){
  const g=room.game; if(!g) return null;
  const revealAll=['round_result','game_over'].includes(g.phase);
  const q=g.question;
  const answers=q ? q.answers.map((a,i)=> (revealAll||g.revealed.has(a.id)) ? {id:a.id,text:a.text,points:a.points} : {id:`slot_${i}`,text:{en:'',ar:''},points:0}) : [];
  return { mode:'online',phase:g.phase,players:room.players.map((p,i)=>({id:i,name:p.name,score:g.scores[i],correct:g.correct[i],wrong:g.wrong[i]})),round:g.round,maxRounds:3,activePlayer:g.activePlayer,remainingTime:g.remainingTime,question:q?{id:q.id,question:q.question,answers}:null,revealedIds:[...g.revealed],roundHistory:g.roundHistory,winner:g.winner,suddenDeath:false,strikes:0,roundPot:0,fastMoney:null };
}
function broadcastGame(room){ io.to(room.code).emit('gameState',publicState(room)); }
function stopTimer(room){ if(room.game?.timer){clearInterval(room.game.timer);room.game.timer=null;} }
function drawQuestion(room){ if(!room.queue?.length) room.queue=shuffle(ONLINE_QUESTIONS); return room.queue.pop(); }
function startRound(room){
  const g=room.game; stopTimer(room); g.question=drawQuestion(room); g.revealed=new Set(); g.phase='round_intro'; g.activePlayer=g.round%2; g.remainingTime=60; g.roundStart=[...g.scores]; broadcastGame(room);
  setTimeout(()=>{ if(!rooms.has(room.code)||room.game!==g||g.phase!=='round_intro')return; g.phase='round_active'; broadcastGame(room); const started=Date.now(); const initial=60; g.timer=setInterval(()=>{const next=Math.max(0,initial-Math.floor((Date.now()-started)/1000)); if(next!==g.remainingTime){g.remainingTime=next;broadcastGame(room);} if(next<=0){endRound(room,'time');}},250); },850);
}
function endRound(room,reason){
  const g=room.game; if(!g||g.phase!=='round_active')return; stopTimer(room); g.phase='round_result'; g.roundHistory.push({round:g.round+1,scores:g.scores.map((v,i)=>v-g.roundStart[i]),totals:[...g.scores],reason}); broadcastGame(room);
}
function finishGame(room){ const g=room.game; stopTimer(room); g.phase='game_over'; g.winner=g.scores[0]===g.scores[1]?null:(g.scores[0]>g.scores[1]?0:1); broadcastGame(room); }
function playerIndex(room,token){ return room.players.findIndex(p=>p.token===token); }
function removePlayer(room,token){ const idx=playerIndex(room,token); if(idx<0)return; room.players.splice(idx,1); if(!room.players.length){stopTimer(room);rooms.delete(room.code);return;} if(room.hostToken===token) room.hostToken=room.players[0].token; broadcastLobby(room); }

io.on('connection',socket=>{
  socket.on('createRoom',(data,ack=()=>{})=>{
    const roomCode=code(); const token=clean(data.token); if(!token)return ack({ok:false,message:'Missing player token.'});
    const room={code:roomCode,hostToken:token,language:data.language==='ar'?'ar':'en',players:[{token,name:clean(data.name)||'Player 1',socketId:socket.id,connected:true,disconnectTimer:null}],game:null,queue:shuffle(ONLINE_QUESTIONS)};
    rooms.set(roomCode,room); socket.join(roomCode); socket.data.roomCode=roomCode; socket.data.token=token; ack({ok:true,roomCode}); broadcastLobby(room);
  });
  socket.on('joinRoom',(data,ack=()=>{})=>{
    const roomCode=clean(data.roomCode).toUpperCase(); const room=rooms.get(roomCode); if(!room)return ack({ok:false,message:'Room not found.'}); if(room.players.length>=2)return ack({ok:false,message:'Room is full.'});
    const token=clean(data.token); room.players.push({token,name:clean(data.name)||'Player 2',socketId:socket.id,connected:true,disconnectTimer:null}); socket.join(roomCode); socket.data.roomCode=roomCode; socket.data.token=token; ack({ok:true,roomCode}); broadcastLobby(room);
  });
  socket.on('rejoinRoom',data=>{
    const room=rooms.get(clean(data.roomCode).toUpperCase()); if(!room)return; const p=room.players.find(x=>x.token===clean(data.token)); if(!p)return; if(p.disconnectTimer)clearTimeout(p.disconnectTimer); p.disconnectTimer=null;p.connected=true;p.socketId=socket.id;socket.join(room.code);socket.data.roomCode=room.code;socket.data.token=p.token;broadcastLobby(room);if(room.game)socket.emit('gameState',publicState(room));
  });
  socket.on('startMatch',data=>{
    const room=rooms.get(clean(data.roomCode).toUpperCase()); if(!room||room.hostToken!==clean(data.token)||room.players.length<2||room.players.some(p=>!p.connected))return;
    room.queue=shuffle(ONLINE_QUESTIONS); room.game={phase:'round_intro',round:0,scores:[0,0],correct:[0,0],wrong:[0,0],activePlayer:0,remainingTime:60,question:null,revealed:new Set(),roundHistory:[],roundStart:[0,0],winner:null,timer:null}; startRound(room);
  });
  socket.on('submitGuess',data=>{
    const room=rooms.get(clean(data.roomCode).toUpperCase()); const g=room?.game; if(!room||!g||g.phase!=='round_active')return; const idx=playerIndex(room,clean(data.token)); if(idx<0||idx!==g.activePlayer)return socket.emit('feedback',{type:'wrong',message:'Not your turn.'});
    const input=clean(data.answer); if(!input)return socket.emit('feedback',{type:'empty'}); const a=matchAnswer(g.question,input,room.language); if(a&&g.revealed.has(a.id))return socket.emit('feedback',{type:'duplicate'});
    if(a){g.revealed.add(a.id);g.scores[idx]+=a.points;g.correct[idx]+=1;io.to(room.code).emit('feedback',{type:'correct',playerId:idx,answer:a,top:g.question.answers[0].id===a.id});}
    else{g.scores[idx]=Math.max(0,g.scores[idx]-5);g.wrong[idx]+=1;io.to(room.code).emit('feedback',{type:'wrong',playerId:idx,penalty:5});}
    if(g.revealed.size>=g.question.answers.length)return endRound(room,'cleared'); g.activePlayer=1-g.activePlayer; broadcastGame(room);
  });
  socket.on('nextRound',data=>{
    const room=rooms.get(clean(data.roomCode).toUpperCase()); const g=room?.game; if(!room||!g||room.hostToken!==clean(data.token)||g.phase!=='round_result')return; g.round+=1; if(g.round>=3)finishGame(room); else startRound(room);
  });
  socket.on('leaveRoom',data=>{const room=rooms.get(clean(data.roomCode).toUpperCase());if(room)removePlayer(room,clean(data.token));socket.leave(clean(data.roomCode).toUpperCase());});
  socket.on('disconnect',()=>{
    const room=rooms.get(socket.data.roomCode); if(!room)return; const p=room.players.find(x=>x.token===socket.data.token); if(!p)return; p.connected=false; broadcastLobby(room); p.disconnectTimer=setTimeout(()=>{const latest=rooms.get(room.code);if(latest){const lp=latest.players.find(x=>x.token===p.token);if(lp&&!lp.connected)removePlayer(latest,p.token);}},20000);
  });
});

server.listen(PORT,()=>console.log(`Survey Showdown running at http://localhost:${PORT}`));
