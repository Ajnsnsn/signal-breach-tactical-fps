
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP,WEAPONS} from '../game/src/sim.js';
import {blocked,moveBody,route,canSee} from '../game/src/physics.js';
const tick=(g,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/STEP);i++)g.update(STEP,input);};
test('collision prevents tunneling and navigation reaches both relays',()=>{
 const body={x:0,z:25,vx:0,vz:0};moveBody(body,0,-90);assert.ok(!blocked(body.x,body.z));assert.ok(body.z>-30);
 for(const x of [-19,19]){const path=route({x:0,z:25},{x,z:-19});assert.ok(path.length>10);assert.ok(path.every(p=>!blocked(p.x,p.z)));}
 assert.equal(canSee({x:-10,z:22},{x:-10,z:3}),false);
});
test('economy validates phase, price and persistent equipment',()=>{
 const g=new Game();g.start();assert.equal(g.buy('marksman'),true);assert.equal(g.money,400);assert.equal(g.buy('armor'),false);
 g.deploy();assert.equal(g.buy('smg'),false);g.end(g.playerTeam,'test outcome');assert.equal(g.money,2800);tick(g,6.1);
 assert.equal(g.phase,'buy');assert.equal(g.player.weapon,'marksman');assert.equal(g.player.ammo,WEAPONS.marksman.mag);
});
test('ammunition and timed reload conserve rounds',()=>{
 const g=new Game();g.start();g.deploy();const p=g.player;g.actors.filter(a=>!a.human).forEach(a=>a.alive=false);
 assert.equal(g.fire(p),true);assert.equal(p.ammo,11);assert.equal(g.fire(p),false);
 p.ammo=2;p.reserve=5;assert.equal(g.reload(p),true);
 for(let i=0;i<90;i++){g.phase='live';g.update(STEP);}
 assert.equal(p.ammo,7);assert.equal(p.reserve,0);assert.equal(g.reload(p),false);
});
test('plant and contested defuse resolve correctly',()=>{
 const g=new Game();g.start();g.deploy();const p=g.player;p.x=-19;p.z=-19;
 for(let i=0;i<181;i++)g.interact(p,STEP);assert.equal(g.objective.state,'planted');
 const d=g.actors[3],d2=g.actors[4];d.x=d2.x=-19;d.z=d2.z=-19;
 for(let i=0;i<310;i++){g.interact(d,STEP);g.interact(d2,STEP);}
 assert.equal(g.objective.state,'defused');assert.equal(g.lastWinner,1);assert.equal(g.score[1],1);
});
test('eliminated attackers do not cancel an armed charge',()=>{
 const g=new Game();g.start();g.deploy();g.objective={state:'planted',x:-19,z:-19,timer:.05,progress:0,by:null,carrier:0};
 for(const a of g.actors)if(a.team===0)a.alive=false;tick(g,.1);
 assert.equal(g.lastWinner,0);assert.equal(g.result,'Signal relay breached');
});
test('friendly fire grants no kill reward',()=>{
 const g=new Game();g.start();g.deploy();const cash=g.money;g.damage(g.actors[1],500,g.player);
 assert.equal(g.kills,0);assert.equal(g.money,cash);
});


