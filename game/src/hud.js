
import {WEAPONS} from './sim.js';
import {layout} from './layout.js';
import {distance,canSee} from './physics.js';
export const $=id=>document.getElementById(id);
const text=(id,value)=>{const el=$(id);if(el.textContent!==String(value))el.textContent=value;};
export class HUD {
 constructor(){this.ctx=$('radar').getContext('2d');this.messageTime=0;this.hitTime=0;this.hurtTime=0;this.feed=[];}
 notice(message){text('notice',message);this.messageTime=3;}
 event(e,g){
  if(e.type==='kill'){const a=g.actors[e.attacker],v=g.actors[e.id];this.feed.unshift({text:(a?.human?'YOU':a?['RAIDER','CUSTODIAN'][a.team]+' '+(a.id%3+1):'BLAST')+'  /  '+(v.human?'YOU':['RAIDER','CUSTODIAN'][v.team]+' '+(v.id%3+1))+(e.head?' · HEADSHOT':''),until:g.time+5});this.feed=this.feed.slice(0,4);}
  if(e.type==='hit'&&e.attacker===g.player?.id)this.hitTime=.18;
  if(e.type==='hit'&&e.id===g.player?.id)this.hurtTime=.3;
  if(e.type==='plant')this.notice('CHARGE ARMED / RELAY '+e.site);
  if(e.type==='drop')this.notice('CHARGE DROPPED / RECOVER IT');
  if(e.type==='pickup')this.notice('CHARGE RECOVERED');
  if(e.type==='deploy')this.notice(g.playerTeam===0?'RAIDERS / BREACH A OR B':'CUSTODIANS / PROTECT BOTH RELAYS');
 }
 update(g,dt){
  if(!g.started)return;const p=g.player,obj=g.objective;
  text('scoreA',g.score[0]);text('scoreB',g.score[1]);text('round','ROUND '+String(g.round).padStart(2,'0'));
  const timer=g.phase==='buy'?g.phaseTime:obj.state==='planted'?obj.timer:g.clock;
  const seconds=Math.ceil(Math.max(0,timer));text('timer',Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));
  $('timer').style.color=obj.state==='planted'?'#ff9975':'';
  text('phase',g.phase==='buy'?'REQUISITION':obj.state==='planted'?'CHARGE ARMED':g.phase==='result'?'ROUND COMPLETE':'RELAY OPERATION');
  text('aliveA',g.actors.filter(a=>a.team===0).map(a=>a.alive?'●':'○').join(' '));text('aliveB',g.actors.filter(a=>a.team===1).map(a=>a.alive?'●':'○').join(' '));
  text('health',Math.ceil(p.hp));text('armor','◇ '+Math.ceil(p.armor)+' ARMOR');$('healthbar').style.width=p.hp+'%';
  text('ammo',p.ammo);text('reserve','/ '+p.reserve);text('weapon',WEAPONS[p.weapon].name);text('reload',p.reload>0?'RELOADING '+p.reload.toFixed(1)+'s':p.ammo===0?'R / RELOAD':'1 PRIMARY · 2 SIDEARM');
  text('money',g.money.toLocaleString('en-US'));text('shopCash',g.money.toLocaleString('en-US')+' CREDITS');text('grenades','G / '+g.grenades+' FRAG');
  $('crosshair').style.setProperty('--gap',(5+Math.hypot(p.vx,p.vz)*2+p.recoil*50)+'px');$('crosshair').style.display=p.alive?'block':'none';
  text('role',g.playerTeam===0?'RAIDER / ATTACK':'CUSTODIAN / DEFEND');
  text('mission',!p.alive?'SPECTATING YOUR SQUAD':obj.state==='planted'?(g.playerTeam===0?'HOLD THE CHARGE':'DEFUSE THE CHARGE'):obj.state==='dropped'?'RECOVER THE CHARGE':g.playerTeam===0?'BREACH EITHER RELAY':'PROTECT BOTH RELAYS');
  text('missionSub',!p.alive?'Next deployment in the following round':obj.state==='planted'?'35 seconds from arming to detonation':g.playerTeam===0?(obj.carrier===p.id?'You carry the charge · Hold E at A or B':'Support the charge carrier'):'Deny the plant · Hold E to defuse');
  let hint='',amount=0;
  if(p.alive&&g.phase==='live'){
   if(obj.state==='planted'&&p.team===1&&distance(p,obj)<2.8){hint='HOLD E / DEFUSE';amount=obj.progress/5;}
   else if(obj.state==='carried'&&obj.carrier===p.id&&layout.sites.some(s=>distance(p,s)<3.5)){hint='HOLD E / PLANT CHARGE';amount=obj.progress/3;}
   else if(p.reload>0){hint='RELOADING';amount=1-p.reload/WEAPONS[p.weapon].reload;}
  }
  $('interaction').style.display=hint?'block':'none';text('interactText',hint);$('progress').style.width=Math.min(100,amount*100)+'%';
  $('result').style.display=g.phase==='result'?'block':'none';
  if(g.phase==='result'){text('resultTag','ROUND '+g.round+' / '+(g.lastWinner===g.playerTeam?'VICTORY':'DEFEAT'));text('resultTitle',g.lastWinner===g.playerTeam?'FREQUENCY SECURED':'SIGNAL LOST');text('resultSub',g.result+' · Next deployment in '+Math.ceil(g.phaseTime)+'s');}
  this.messageTime-=dt;this.hitTime-=dt;this.hurtTime-=dt;$('notice').style.opacity=this.messageTime>0?'1':'0';$('hitmarker').style.opacity=this.hitTime>0?'1':'0';$('damage').style.opacity=Math.max(0,this.hurtTime*2);
  this.feed=this.feed.filter(f=>f.until>g.time);const feed=this.feed.map(f=>'<p>'+f.text+'</p>').join('');if($('feed').innerHTML!==feed)$('feed').innerHTML=feed;
  for(const el of document.querySelectorAll('[data-buy]')){const item=el.dataset.buy,cost=WEAPONS[item]?.price??(item==='armor'?650:300);el.disabled=g.money<cost||(item==='armor'&&p.armor>=100)||(item==='grenade'&&g.grenades>=2);}
  this.radar(g);
 }
 radar(g){
  const c=this.ctx,p=g.player,s=2.8,origin=90;c.clearRect(0,0,180,180);c.fillStyle='#254b50';c.fillRect(6,6,168,168);
  c.strokeStyle='#a0d7ca22';c.lineWidth=1;for(let n=6;n<=174;n+=28){c.beginPath();c.moveTo(n,6);c.lineTo(n,174);c.moveTo(6,n);c.lineTo(174,n);c.stroke();}
  c.fillStyle='#a2b8aa66';for(const w of layout.walls)c.fillRect(origin+(w.x-w.w/2)*s,origin+(w.z-w.d/2)*s,w.w*s,w.d*s);
  for(const site of layout.sites){c.fillStyle='#f7c98f';c.font='bold 13px Arial';c.textAlign='center';c.fillText(site.name,origin+site.x*s,origin+site.z*s+4);}
  for(const a of g.actors)if(a.alive&&(a.team===p.team||(distance(a,p)<30&&canSee(p,a)))){c.fillStyle=a.id===p.id?'#ffffff':a.team===p.team?'#86f1cf':'#ff9975';c.beginPath();c.arc(origin+a.x*s,origin+a.z*s,a.id===p.id?4:3,0,Math.PI*2);c.fill();}
  c.strokeStyle='#ffffff';c.beginPath();c.moveTo(origin+p.x*s,origin+p.z*s);c.lineTo(origin+p.x*s-Math.sin(p.yaw)*11,origin+p.z*s-Math.cos(p.yaw)*11);c.stroke();
  if(g.objective.state==='planted'||g.objective.state==='dropped'){c.strokeStyle='#ffbc81';c.lineWidth=2;c.strokeRect(origin+g.objective.x*s-5,origin+g.objective.z*s-5,10,10);}
 }
}


