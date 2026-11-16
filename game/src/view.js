
import * as THREE from 'three';
import {layout} from './layout.js';
import {buildWorld} from './world.js';
export class View {
 constructor(canvas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xb6cdca);this.scene.fog=new THREE.Fog(0xb6cdca,48,135);
  this.camera=new THREE.PerspectiveCamera(76,1,.06,230);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  this.world=buildWorld(THREE,this.scene,layout);this.bots=[];this.tracers=[];this.particles=[];this.grenades=[];
  this.box=new THREE.BoxGeometry(1,1,1);this.sphere=new THREE.SphereGeometry(1,10,7);
  this.materials={dark:new THREE.MeshStandardMaterial({color:0x193b40,roughness:.62}),metal:new THREE.MeshStandardMaterial({color:0x85a4a0,metalness:.5,roughness:.5}),teal:new THREE.MeshStandardMaterial({color:0x35b9ac,roughness:.65}),coral:new THREE.MeshStandardMaterial({color:0xea795d,roughness:.65}),cloth:new THREE.MeshStandardMaterial({color:0x314b50}),glow:new THREE.MeshBasicMaterial({color:0xffd88d})};
  for(let i=0;i<6;i++)this.bots.push(this.makeBot(i<3?0:1));
  this.weapon=new THREE.Group();this.camera.add(this.weapon);this.buildGun('sidearm');
  this.charge=new THREE.Group();this.mesh(this.box,this.materials.dark,[.65,.2,.45],[0,0,0],this.charge);this.mesh(this.box,this.materials.glow,[.4,.04,.1],[0,.12,0],this.charge);this.scene.add(this.charge);
  for(let i=0;i<4;i++){const g=this.mesh(this.sphere,this.materials.dark,[.13,.13,.13],[0,-50,0],this.scene);g.visible=false;this.grenades.push(g);}
  for(let i=0;i<28;i++){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xffd2a0,transparent:true,opacity:.8}));line.visible=false;this.scene.add(line);this.tracers.push({mesh:line,life:0});}
  for(let i=0;i<40;i++){const m=this.mesh(this.box,this.materials.glow,[.08,.08,.08],[0,-50,0],this.scene);m.visible=false;this.particles.push({mesh:m,life:0,vx:0,vy:0,vz:0});}
  this.muzzle=new THREE.PointLight(0xffb35b,0,4);this.camera.add(this.muzzle);this.muzzle.position.set(.3,-.3,-.8);this.flash=0;this.shake=0;this.gunName='sidearm';this.eye=1.55;
  this.resize();addEventListener('resize',()=>this.resize());
 }
 mesh(geo,mat,scale,pos,parent){const m=new THREE.Mesh(geo,mat);m.scale.set(...scale);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 makeBot(team){
  const group=new THREE.Group(),mat=team===0?this.materials.teal:this.materials.coral;
  this.mesh(this.box,this.materials.cloth,[.42,.58,.24],[0,1.02,0],group);this.mesh(this.box,mat,[.48,.4,.3],[0,1.13,0],group);
  this.mesh(this.sphere,this.materials.metal,[.21,.23,.2],[0,1.56,0],group);this.mesh(this.box,this.materials.dark,[.34,.08,.12],[0,1.58,-.15],group);this.mesh(this.box,mat,[.2,.2,.19],[0,1.75,0],group);
  this.mesh(this.box,this.materials.dark,[.15,.12,.65],[.27,1.08,-.36],group);
  this.mesh(this.box,mat,[.14,.43,.16],[-.3,1.0,0],group).rotation.z=-.25;this.mesh(this.box,mat,[.14,.35,.16],[.3,1.04,-.07],group).rotation.x=-.7;
  const legs=[this.mesh(this.box,this.materials.cloth,[.17,.7,.2],[-.13,.4,0],group),this.mesh(this.box,this.materials.cloth,[.17,.7,.2],[.13,.4,0],group)];
  const marker=this.mesh(new THREE.ConeGeometry(.12,.22,3),new THREE.MeshBasicMaterial({color:0xb6fff0}),[1,1,1],[0,2.13,0],group);marker.rotation.z=Math.PI;
  this.scene.add(group);return {group,legs,marker};
 }
 buildGun(name){
  while(this.weapon.children.length)this.weapon.remove(this.weapon.children[0]);
  const m=this.materials,length=name==='sidearm'?.35:name==='marksman'?.86:.65;
  this.mesh(this.box,m.dark,[.14,.17,length],[0,0,-.2],this.weapon);this.mesh(this.box,m.metal,[.12,.05,length*.8],[0,.11,-.2],this.weapon);this.mesh(this.box,m.teal,[.16,.04,.24],[0,.02,-.16],this.weapon);
  this.mesh(this.box,m.dark,[.07,.07,.25],[0,.02,-length*.62-.2],this.weapon);this.mesh(this.box,m.dark,[.12,.24,.16],[0,-.18,-.08],this.weapon).rotation.x=-.22;
  this.mesh(this.box,m.cloth,[.15,.18,.32],[.03,-.2,.1],this.weapon).rotation.x=.5;this.mesh(this.box,m.teal,[.17,.19,.38],[.05,-.3,.28],this.weapon).rotation.x=.65;
  this.mesh(this.box,m.metal,[.025,.05,.025],[0,.16,-length*.52],this.weapon);this.mesh(this.box,m.dark,[.08,.07,.05],[0,.15,.03],this.weapon);
  if(name==='marksman'){this.mesh(this.box,m.dark,[.14,.14,.27],[0,.2,-.2],this.weapon);this.mesh(this.box,m.teal,[.1,.09,.02],[0,.2,-.35],this.weapon);}
  this.gunName=name;
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}


 event(e,game){
  if(e.type==='shot'){const t=this.tracers.find(t=>t.life<=0)||this.tracers[0],a=t.mesh.geometry.attributes.position;a.setXYZ(0,e.x,e.y,e.z);a.setXYZ(1,e.tx,e.ty,e.tz);a.needsUpdate=true;t.mesh.geometry.computeBoundingSphere();t.life=.065;t.mesh.visible=true;if(e.id===game.player.id){this.flash=.055;this.shake=.045;}this.spark(e.tx,e.ty,e.tz,3);}
  if(e.type==='explosion'){this.spark(e.x,e.y,e.z,28);this.shake=.13;}if(e.type==='hit'&&e.id===game.player.id)this.shake=.08;
 }
 spark(x,y,z,count){let n=0;for(const p of this.particles)if(p.life<=0){p.life=.25+Math.random()*.25;p.mesh.position.set(x,y,z);p.vx=(Math.random()-.5)*9;p.vy=Math.random()*7;p.vz=(Math.random()-.5)*9;p.mesh.visible=true;if(++n>=count)break;}}
 render(game,dt,playing,aiming){
  const p=game.player;
  if(!game.started){const t=performance.now()*.00008;this.camera.position.set(39*Math.sin(t),27,39*Math.cos(t));this.camera.lookAt(0,0,-4);this.weapon.visible=false;}
  else{
   let subject=p;if(!p.alive)subject=game.actors.find(a=>a.team===p.team&&a.alive)||p;
   this.eye+=((subject.crouch?1.05:1.55)-this.eye)*Math.min(1,dt*14);
   const speed=Math.hypot(subject.vx,subject.vz),bob=subject.alive?Math.sin(game.time*11)*Math.min(speed*.006,.022):0;
   this.camera.position.set(subject.x,this.eye+bob,subject.z);this.camera.rotation.set(subject.pitch||0,subject.yaw,Math.sin(game.time*71)*this.shake*.06,'YXZ');
   this.weapon.visible=subject===p&&p.alive;if(p.weapon!==this.gunName)this.buildGun(p.weapon);
   const reload=p.reload>0?Math.sin(p.reload*Math.PI/2)*.7:0;
   this.weapon.position.set(aiming?.015:.29,-.27+Math.abs(bob)-reload*.25,-.5+p.recoil*.4);this.weapon.rotation.set(reload*.9+p.recoil*.5,0,reload*.4);
   const fov=aiming?52:76;if(Math.abs(this.camera.fov-fov)>.1){this.camera.fov+=(fov-this.camera.fov)*Math.min(1,dt*12);this.camera.updateProjectionMatrix();}
   for(const a of game.actors){const b=this.bots[a.id];b.group.visible=a.id!==subject.id;b.group.position.set(a.x,a.alive?0:.15,a.z);b.group.rotation.set(0,a.yaw,a.alive?0:Math.PI/2);b.group.scale.y=a.crouch?.67:1;b.marker.visible=a.team===p.team&&a.alive;const walk=Math.hypot(a.vx,a.vz)>.5&&a.alive?Math.sin(game.time*9+a.id)*.36:0;b.legs[0].rotation.x=walk;b.legs[1].rotation.x=-walk;}
  }
  const obj=game.objective;this.charge.visible=game.started&&(obj.state==='planted'||obj.state==='dropped');this.charge.position.set(obj.x,.2,obj.z);this.charge.rotation.y=game.time;
  for(let i=0;i<this.grenades.length;i++){const m=this.grenades[i],g=game.projectiles[i];m.visible=!!g;if(g)m.position.set(g.x,g.y,g.z);}
  for(const t of this.tracers){t.life-=dt;t.mesh.visible=t.life>0;}
  for(const p of this.particles)if(p.life>0){p.life-=dt;p.mesh.visible=p.life>0;p.vy-=15*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;}
  this.flash=Math.max(0,this.flash-dt);this.muzzle.intensity=this.flash>0?5:0;this.shake=Math.max(0,this.shake-dt*.4);this.world.update(game.time);this.renderer.render(this.scene,this.camera);
 }
}


