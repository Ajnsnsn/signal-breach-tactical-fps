
import {layout} from './layout.js';
import {distance as dist,angle,clamp,blocked,rayBox,wallHit,sphereHit,canSee,route,moveBody} from './physics.js';
export const STEP=1/60;
export const WEAPONS={
 sidearm:{name:'KESTREL / 9',price:0,mag:12,reserve:60,damage:27,head:3.2,interval:.24,reload:1.35,spread:.006,kick:.022,range:65},
 smg:{name:'TIDE / 24',price:1000,mag:24,reserve:120,damage:21,head:3,interval:.085,reload:1.7,spread:.014,kick:.013,range:45},
 rifle:{name:'OSPREY / 30',price:1600,mag:30,reserve:90,damage:32,head:3.1,interval:.13,reload:2.05,spread:.004,kick:.022,range:85},
 marksman:{name:'MERIDIAN / 8',price:2200,mag:8,reserve:40,damage:66,head:2.1,interval:.65,reload:2.5,spread:.0017,kick:.052,range:100}
};
function actor(id,team,x,z,human=false){return {id,team,x,z,vx:0,vz:0,yaw:team===0?0:Math.PI,pitch:0,hp:100,armor:0,crouch:false,alive:true,human,weapon:human?'sidearm':'rifle',ammo:30,reserve:90,cooldown:0,reload:0,recoil:0,inventory:{},path:[],think:0,target:null,alert:0,aimTime:0,hear:null,stuck:0,foot:0};}
export class Game {
 constructor(seed=7183){this.seed=seed;this.time=0;this.events=[];this.score=[0,0];this.round=0;this.phase='menu';this.phaseTime=0;this.money=2600;this.kills=0;this.deaths=0;this.playerTeam=0;this.site=0;this.selectedWeapon='sidearm';this.armor=0;this.grenades=1;this.actors=[];this.projectiles=[];this.noises=[];this.objective={state:'carried',x:0,z:0,timer:0,progress:0,by:null};this.lossStreak=0;this.lastWinner=-1;this.result='';this.started=false;}
 random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
 emit(type,data={}){this.events.push({type,...data});}
 start(){this.started=true;this.newRound();}
 newRound(){
  this.round++;this.phase='buy';this.phaseTime=12;this.clock=95;this.projectiles.length=0;this.noises.length=0;this.site=this.round%2;
  this.playerTeam=Math.floor((this.round-1)/3)%2;this.actors=[];
  for(let team=0;team<2;team++)for(let j=0;j<3;j++){
   const human=team===this.playerTeam&&j===0,a=actor(team*3+j,team,(j-1)*2.2,team===0?25:-26,human);a.weapon=human?this.selectedWeapon:(j===2?'smg':'rifle');
   const w=WEAPONS[a.weapon];a.ammo=w.mag;a.reserve=w.reserve;a.armor=human?this.armor:35;a.inventory={sidearm:{ammo:12,reserve:60}};if(a.weapon!=='sidearm')a.inventory[a.weapon]={ammo:w.mag,reserve:w.reserve};a.lane=j===0?this.site:j%2;this.actors.push(a);if(human)this.player=a;
  }
  this.objective={state:'carried',x:0,z:25,timer:0,progress:0,by:null,carrier:this.actors.find(a=>a.team===0&&a.human)?.id??0};this.emit('round');
 }
 deploy(){if(this.phase==='buy'){this.phase='live';this.phaseTime=0;this.emit('deploy');}}
 buy(item){
  if(this.phase!=='buy')return false;
  if(WEAPONS[item]){const w=WEAPONS[item];if(this.money<w.price||item==='sidearm')return false;this.money-=w.price;this.player.weapon=item;this.selectedWeapon=item;this.player.ammo=w.mag;this.player.reserve=w.reserve;this.player.inventory[item]={ammo:w.mag,reserve:w.reserve};this.emit('buy');return true;}
  if(item==='armor'&&this.money>=650&&this.player.armor<100){this.money-=650;this.player.armor=this.armor=100;this.emit('buy');return true;}
  if(item==='grenade'&&this.money>=300&&this.grenades<2){this.money-=300;this.grenades++;this.emit('buy');return true;}return false;
 }
 switchWeapon(primary){const p=this.player;if(!p||p.reload>0)return;const name=primary?this.selectedWeapon:'sidearm';if(p.inventory[name]&&name!==p.weapon){p.inventory[p.weapon]={ammo:p.ammo,reserve:p.reserve};p.weapon=name;Object.assign(p,p.inventory[name]);p.cooldown=.2;this.emit('switch');}}
 reload(a=this.player){if(a&&a.alive&&!a.reload&&a.ammo<WEAPONS[a.weapon].mag&&a.reserve>0){a.reload=WEAPONS[a.weapon].reload;this.emit('reload',{id:a.id});return true;}return false;}
 damage(a,amount,attacker,head=false){
  if(!a.alive)return;const absorbed=Math.min(a.armor,amount*.35);a.armor-=absorbed;a.hp-=amount-absorbed;this.emit('hit',{id:a.id,attacker:attacker?.id,head});
  if(a.hp<=0){a.hp=0;a.alive=false;a.vx=a.vz=0;this.emit('kill',{id:a.id,attacker:attacker?.id,head});if(a.human){this.deaths++;this.selectedWeapon='sidearm';this.armor=0;}if(attacker?.human&&attacker.team!==a.team){this.kills++;this.money+=300;}if(this.objective.carrier===a.id&&this.objective.state==='carried'){this.objective.state='dropped';this.objective.x=a.x;this.objective.z=a.z;this.emit('drop');}}
 }
 fire(a=this.player,aim=null){
  if(this.phase!=='live'||!a?.alive||a.cooldown>0||a.reload>0)return false;
  if(a.ammo===0){this.reload(a);return false;}const w=WEAPONS[a.weapon];a.ammo--;a.cooldown=w.interval;
  const speed=Math.hypot(a.vx,a.vz),spread=w.spread*(a.crouch?.6:1)+speed*.0045+a.recoil*.11;
  let yaw=aim?Math.atan2(-(aim.x-a.x),-(aim.z-a.z)):a.yaw,pitch=aim?Math.atan2((aim.crouch?1:1.35)-(a.crouch?1.05:1.55),dist(a,aim)):a.pitch;
  yaw+=(this.random()-.5)*spread*2;pitch+=(this.random()-.5)*spread*2;
  const d={x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)},o={x:a.x,y:a.crouch?1.05:1.55,z:a.z};let near=wallHit(o,d,w.range),victim=null,head=false;
  for(const b of this.actors)if(b.alive&&b.team!==a.team){const height=b.crouch?1.1:1.72,h=sphereHit(o,d,b.x,height-.16,b.z,.21),body=rayBox(o,d,{x0:b.x-.27,x1:b.x+.27,z0:b.z-.23,z1:b.z+.23,y0:.2,y1:height-.3},near);if(h<near||body<near){head=h<body;near=Math.min(h,body);victim=b;}}
  a.recoil=Math.min(.65,a.recoil+w.kick);if(a.human)a.pitch=clamp(a.pitch+w.kick*.42,-1.3,1.3);
  this.emit('shot',{id:a.id,x:o.x,y:o.y,z:o.z,tx:o.x+d.x*near,ty:o.y+d.y*near,tz:o.z+d.z*near,weapon:a.weapon});this.noises.push({x:a.x,z:a.z,team:a.team,life:1.1,radius:31});
  if(victim)this.damage(victim,w.damage*(head?w.head:1)*(near>35?.83:1),a,head);return true;
 }
 grenade(a=this.player){if(this.phase!=='live'||!a?.alive||!this.grenades)return false;this.grenades--;this.projectiles.push({x:a.x,y:1.45,z:a.z,vx:-Math.sin(a.yaw)*12,vy:4+Math.sin(a.pitch)*5,vz:-Math.cos(a.yaw)*12,life:1.8,owner:a.id});this.emit('throw');return true;}
 end(winner,reason){if(this.phase!=='live')return;this.phase='result';this.phaseTime=6;this.lastWinner=winner;this.score[winner]++;this.result=reason;const win=winner===this.playerTeam;this.lossStreak=win?0:this.lossStreak+1;this.money=Math.min(9000,this.money+(win?2400:Math.min(2400,1400+this.lossStreak*250)));this.armor=this.player.alive?this.player.armor:0;this.emit('end',{win,reason});}
 interact(a,dt){
  const obj=this.objective;
  if(obj.state==='dropped'&&a.team===0&&dist(a,obj)<1.9){obj.state='carried';obj.carrier=a.id;this.emit('pickup');}
  const s=layout.sites.find(s=>dist(a,s)<3.5);
  if(a.team===0&&obj.state==='carried'&&obj.carrier===a.id&&s){if(obj.by!==a.id){obj.progress=0;obj.by=a.id;}obj.progress+=dt;this.holding=true;if(obj.progress>=3){obj.state='planted';obj.x=s.x;obj.z=s.z;obj.timer=35;obj.progress=0;obj.by=null;this.money+=a.human?300:0;this.emit('plant',{site:s.name});}return true;}
  if(a.team===1&&obj.state==='planted'&&dist(a,obj)<2.8){if(obj.by!==null&&obj.by!==a.id)return false;if(obj.by!==a.id){obj.progress=0;obj.by=a.id;}obj.progress+=dt;this.holding=true;if(obj.progress>=5){obj.state='defused';this.end(1,'Relay charge defused');}return true;}return false;
 }


 bot(a,dt){
  a.think-=dt;
  if(a.think<=0){a.think=.18+this.random()*.12;let enemy=null,near=Infinity;
   for(const b of this.actors)if(b.team!==a.team&&b.alive){const distance=dist(a,b),bearing=Math.atan2(-(b.x-a.x),-(b.z-a.z)),fov=Math.abs(angle(bearing-a.yaw))<1.4||distance<5||a.alert>0;if(distance<40&&distance<near&&fov&&canSee(a,b)){enemy=b;near=distance;}}
   a.target=enemy?.id??null;if(enemy){a.alert=4;a.hear={x:enemy.x,z:enemy.z};}else for(const n of this.noises)if(n.team!==a.team&&dist(a,n)<n.radius){a.hear={x:n.x,z:n.z};a.alert=3;}
  }
  const target=this.actors.find(b=>b.id===a.target&&b.alive);a.alert=Math.max(0,a.alert-dt);
  if(target&&canSee(a,target)){
   const desired=Math.atan2(-(target.x-a.x),-(target.z-a.z));a.yaw+=angle(desired-a.yaw)*Math.min(1,dt*8);a.aimTime+=dt;a.crouch=dist(a,target)>14;a.vx*=.75;a.vz*=.75;
   if(a.aimTime>.36+(.09*(a.id%3))&&Math.abs(angle(desired-a.yaw))<.16){const miss=(1-Math.min(1,a.aimTime/1.7))*.65;this.fire(a,{x:target.x+(this.random()-.5)*miss,z:target.z+(this.random()-.5)*miss,crouch:target.crouch});}
   if(!a.ammo)this.reload(a);return;
  }
  a.aimTime=0;a.crouch=false;const obj=this.objective;let goal;
  if(obj.state==='planted'){
   if(a.team===1)goal=obj;else{const offsets=[[-5,3],[5,3],[0,-6]][a.id%3];goal={x:obj.x+offsets[0],z:obj.z+offsets[1]};}
  }else if(a.team===0){goal=obj.state==='dropped'?obj:layout.sites[a.lane];if(obj.carrier===a.id)goal=layout.sites[this.site];}
  else{const s=layout.sites[a.lane];goal={x:s.x+(a.id%3-1)*3,z:s.z+7};}
  if(a.alert>0&&a.hear&&obj.state!=='planted')goal=a.hear;
  if(this.interact(a,dt)){a.vx=a.vz=0;return;}
  if(dist(a,goal)<1.5){a.yaw+=Math.sin(this.time*.65+a.id)*dt*.4;return;}
  a.stuck-=dt;if(!a.path.length||a.stuck<=0){a.path=route(a,goal);a.stuck=2.2;}
  const next=a.path[0];if(next){if(dist(a,next)<.3)a.path.shift();else{const dx=next.x-a.x,dz=next.z-a.z,len=Math.hypot(dx,dz),speed=a.team===0?3.35:3;a.vx=dx/len*speed;a.vz=dz/len*speed;moveBody(a,a.vx*dt,a.vz*dt);const desired=Math.atan2(-dx,-dz);a.yaw+=angle(desired-a.yaw)*Math.min(1,dt*6);}}
  if(a.ammo<WEAPONS[a.weapon].mag*.3&&!a.reload)this.reload(a);
 }
 update(dt,input={}){
  this.time+=dt;if(!this.started)return;
  if(this.phase==='buy'){this.phaseTime-=dt;if(this.phaseTime<=0)this.deploy();return;}
  if(this.phase==='result'){this.phaseTime-=dt;if(this.phaseTime<=0){if(this.score.some(s=>s>=5)){this.phase='match';this.emit('match');}else this.newRound();}return;}
  if(this.phase!=='live')return;
  this.clock-=dt;this.holding=false;
  for(const a of this.actors){a.cooldown=Math.max(0,a.cooldown-dt);a.recoil=Math.max(0,a.recoil-dt*.11);if(a.reload>0){a.reload-=dt;if(a.reload<=0){a.reload=0;const amount=Math.min(WEAPONS[a.weapon].mag-a.ammo,a.reserve);a.ammo+=amount;a.reserve-=amount;this.emit('loaded',{id:a.id});}}}
  const p=this.player;
  if(p.alive){
   p.crouch=!!input.crouch;const forward=(input.forward?1:0)-(input.back?1:0),right=(input.right?1:0)-(input.left?1:0),len=Math.hypot(forward,right)||1,speed=p.crouch?2:input.walk?2.6:4.65;
   const tx=(-Math.sin(p.yaw)*forward+Math.cos(p.yaw)*right)/len*speed,tz=(-Math.cos(p.yaw)*forward-Math.sin(p.yaw)*right)/len*speed,acc=1-Math.exp(-dt*(forward||right?12:19));
   p.vx+=(tx-p.vx)*acc;p.vz+=(tz-p.vz)*acc;moveBody(p,p.vx*dt,p.vz*dt);
   p.foot+=Math.hypot(p.vx,p.vz)*dt;if(p.foot>2.5){p.foot=0;if(!p.crouch&&!input.walk){this.noises.push({x:p.x,z:p.z,team:p.team,life:.6,radius:12});this.emit('step');}}
   if(input.fire&&!input.use)this.fire(p);if(input.use)this.interact(p,dt);else if(this.objective.state==='dropped'&&p.team===0&&dist(p,this.objective)<1.9)this.interact(p,dt);
  }
  for(const a of this.actors)if(a.alive&&!a.human)this.bot(a,dt);
  if(!this.holding){this.objective.progress=0;this.objective.by=null;}
  if(this.objective.state==='carried'){const carrier=this.actors[this.objective.carrier];this.objective.x=carrier.x;this.objective.z=carrier.z;}
  for(let i=this.projectiles.length-1;i>=0;i--){const g=this.projectiles[i];g.life-=dt;g.vy-=12*dt;const nx=g.x+g.vx*dt,nz=g.z+g.vz*dt;
   if(blocked(nx,g.z,.1))g.vx*=-.5;else g.x=nx;if(blocked(g.x,nz,.1))g.vz*=-.5;else g.z=nz;g.y+=g.vy*dt;
   if(g.y<.15){g.y=.15;g.vy=Math.abs(g.vy)*.35;g.vx*=.97;g.vz*=.97;}
   if(g.life<=0){const owner=this.actors[g.owner];this.emit('explosion',{x:g.x,y:g.y,z:g.z});for(const a of this.actors)if(a.alive){const d=dist(a,g);if(d<7&&canSee({x:g.x,z:g.z,crouch:true},a))this.damage(a,(1-d/7)*115,owner);}this.noises.push({x:g.x,z:g.z,team:owner.team,life:2,radius:60});this.projectiles.splice(i,1);}
  }
  for(let i=this.noises.length-1;i>=0;i--){this.noises[i].life-=dt;if(this.noises[i].life<=0)this.noises.splice(i,1);}
  const alive0=this.actors.some(a=>a.team===0&&a.alive),alive1=this.actors.some(a=>a.team===1&&a.alive);
  if(this.objective.state==='planted'){this.objective.timer-=dt;if(this.objective.timer<=0){this.objective.state='detonated';this.emit('explosion',{x:this.objective.x,y:1,z:this.objective.z});this.end(0,'Signal relay breached');}else if(!alive1)this.end(0,'All custodians eliminated');}
  else if(!alive0)this.end(1,'All raiders eliminated');else if(!alive1)this.end(0,'All custodians eliminated');else if(this.clock<=0)this.end(1,'Relay held until extraction');
 }
 snapshot(){return {phase:this.phase,round:this.round,score:[...this.score],clock:this.clock,money:this.money,player:{id:this.player?.id,x:this.player?.x,z:this.player?.z,hp:this.player?.hp,ammo:this.player?.ammo,reserve:this.player?.reserve,weapon:this.player?.weapon,alive:this.player?.alive,yaw:this.player?.yaw,pitch:this.player?.pitch,vx:this.player?.vx,vz:this.player?.vz,crouch:this.player?.crouch,reload:this.player?.reload,armor:this.player?.armor},objective:{...this.objective},actors:this.actors.map(a=>({id:a.id,team:a.team,x:a.x,z:a.z,hp:a.hp,alive:a.alive,target:a.target,path:a.path.length})),grenades:this.grenades};}
}




