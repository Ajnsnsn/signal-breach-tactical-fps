
import {Game,STEP} from './sim.js';
import {View} from './view.js';
import {HUD,$} from './hud.js';
import {Sound} from './audio.js';
import {clamp} from './physics.js';
const canvas=$('game'),sound=new Sound(),hud=new HUD();
let game=new Game(),view,shop=false,locked=false,fallback=false,accumulator=0,last=performance.now(),hudClock=0,sensitivity=.002;
const keys=new Set(),input={forward:false,back:false,left:false,right:false,crouch:false,walk:false,use:false,fire:false},mouse={left:false,right:false};
function visible(id,yes){$(id).classList.toggle('hidden',!yes);}
function release(){keys.clear();mouse.left=mouse.right=false;input.fire=false;}
function requestLock(){fallback=false;sound.unlock();setTimeout(()=>{if(!locked&&!fallback&&!shop&&game.phase!=='match'){visible('pause',true);}},900);try{const p=canvas.requestPointerLock();if(p?.catch)p.catch(()=>hud.notice('Click the game to capture the mouse'));}catch{hud.notice('Click the game to capture the mouse');}}
function openShop(){fallback=false;shop=true;visible('buy',true);visible('pause',false);document.exitPointerLock();release();}
function begin(){hud.feed=[];hud.messageTime=hud.hitTime=hud.hurtTime=0;sound.lastBeep=-1;$('purchaseNote').textContent='You have one frag charge for this operation.';game=new Game();game.start();visible('menu',false);visible('match',false);visible('hud',true);visible('pause',false);sound.unlock();openShop();}
function deploy(){shop=false;visible('buy',false);game.deploy();requestLock();}
$('start').addEventListener('click',begin);$('again').addEventListener('click',begin);$('restart').addEventListener('click',begin);
$('deploy').addEventListener('click',deploy);$('resume').addEventListener('click',requestLock);
$('drag').addEventListener('click',()=>{sound.unlock();fallback=true;visible('pause',false);hud.notice('DRAG LOOK / HOLD RIGHT MOUSE TO AIM');});
$('mute').addEventListener('click',()=>{$('mute').textContent=sound.toggle()?'AUDIO OFF':'AUDIO ON';});
$('sensitivity').addEventListener('input',e=>sensitivity=.0005+Number(e.target.value)*.000375);
for(const el of document.querySelectorAll('[data-buy]'))el.addEventListener('click',()=>{if(game.buy(el.dataset.buy))$('purchaseNote').textContent=el.querySelector('b').textContent+' requisitioned. Ready for deployment.';else $('purchaseNote').textContent='Insufficient credits or equipment already full.';hud.update(game,0);});
canvas.addEventListener('click',()=>{if(game.started&&!shop&&game.phase!=='match'&&!locked&&!fallback)requestLock();});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;if(!locked)release();visible('pause',game.started&&!locked&&!fallback&&!shop&&game.phase!=='match');});
document.addEventListener('mousemove',e=>{if((locked||(fallback&&mouse.right))&&game.player?.alive){game.player.yaw-=e.movementX*sensitivity*(mouse.right?.65:1);game.player.pitch=clamp(game.player.pitch-e.movementY*sensitivity*(mouse.right?.65:1),-1.3,1.3);}});
document.addEventListener('mousedown',e=>{if(locked||fallback){if(e.button===0)mouse.left=true;if(e.button===2)mouse.right=true;}});
document.addEventListener('mouseup',e=>{if(e.button===0)mouse.left=false;if(e.button===2)mouse.right=false;});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{
 if(['Space','Tab','ControlLeft','ControlRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)&&(locked||fallback))e.preventDefault();
 keys.add(e.code);if(e.repeat)return;if(e.code==='Escape'&&fallback){fallback=false;release();visible('pause',true);return;}
 if(e.code==='Enter'&&shop){deploy();return;}
 if(e.code==='KeyM'){$('mute').textContent=sound.toggle()?'AUDIO OFF':'AUDIO ON';return;}
 if(e.code==='KeyB'&&game.started){if(game.phase==='buy')shop?deploy():openShop();else hud.notice('REQUISITION OPENS BETWEEN ROUNDS');}
 if((!locked&&!fallback)||shop)return;
 if(e.code==='KeyR')game.reload();if(e.code==='KeyG')game.grenade();if(e.code==='Digit1')game.switchWeapon(true);if(e.code==='Digit2')game.switchWeapon(false);
});
document.addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{release();if(fallback){fallback=false;visible('pause',true);}if(locked)document.exitPointerLock();});
document.addEventListener('visibilitychange',()=>{accumulator=0;last=performance.now();if(document.hidden){release();fallback=false;if(locked)document.exitPointerLock();if(game.started&&!shop&&game.phase!=='match')visible('pause',true);}});
function readInput(){input.forward=keys.has('KeyW');input.back=keys.has('KeyS');input.left=keys.has('KeyA');input.right=keys.has('KeyD');input.walk=keys.has('ShiftLeft')||keys.has('ShiftRight');input.crouch=keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyC');input.use=keys.has('KeyE');input.fire=mouse.left;}
function events(){for(const e of game.events){hud.event(e,game);view.event(e,game);sound.event(e,game);if(e.type==='round'&&game.phase==='buy'&&!shop)openShop();if(e.type==='match'){document.exitPointerLock();visible('pause',false);visible('match',true);$('matchTitle').innerHTML=game.score[game.playerTeam]>=5?'FREQUENCY<br>SECURED.':'SIGNAL<br>LOST.';$('matchSummary').textContent='Raiders '+game.score[0]+' — '+game.score[1]+' Custodians · '+game.kills+' eliminations / '+game.deaths+' deaths';}}game.events.length=0;}
function frame(now){
 const elapsed=Math.min((now-last)/1000,.25),dt=Math.min(elapsed,.05);last=now;
 if((locked||fallback)&&!shop&&!document.hidden&&game.phase!=='match'){readInput();accumulator+=elapsed;while(accumulator>=STEP){game.update(STEP,input);accumulator-=STEP;}}else accumulator=0;
 events();hudClock+=dt;if(hudClock>.05){hud.update(game,hudClock);hudClock=0;}
 sound.update(game);view.render(game,dt,locked,mouse.right);requestAnimationFrame(frame);
}
try{view=new View(canvas);requestAnimationFrame(frame);}catch(error){visible('error',true);$('error').textContent='WebGL could not start. Please use desktop Chrome with hardware acceleration enabled. '+error.message;throw error;}
// Read-only observability for QA; all play still uses the real input and simulation.
window.signalBreach=Object.freeze({snapshot:()=>game.snapshot(),version:'1.0.0',controls:()=>({locked,dragLook:fallback}),renderer:()=>({triangles:view.renderer.info.render.triangles,calls:view.renderer.info.render.calls,webgl:!!view.renderer.getContext()})});



