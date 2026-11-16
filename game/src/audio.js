
export class Sound {
 constructor(){this.ctx=null;this.muted=false;this.lastBeep=-1;}
 unlock(){if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.35;this.master.connect(this.ctx.destination);const count=this.ctx.sampleRate;this.noise=this.ctx.createBuffer(1,count,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<count;i++)data[i]=Math.random()*2-1;}this.ctx.resume();}
 toggle(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.35;return this.muted;}
 tone(freq,duration,volume=.2,type='sine',pan=0){
  if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),p=this.ctx.createStereoPanner();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*.55),this.ctx.currentTime+duration);g.gain.setValueAtTime(volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);p.pan.value=pan;o.connect(g);g.connect(p);p.connect(this.master);o.start();o.stop(this.ctx.currentTime+duration);
 }
 burst(duration,volume,frequency,pan=0){
  if(!this.ctx)return;const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),p=this.ctx.createStereoPanner();source.buffer=this.noise;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(volume,this.ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);p.pan.value=pan;source.connect(filter);filter.connect(gain);gain.connect(p);p.connect(this.master);source.start();source.stop(this.ctx.currentTime+duration);
 }
 event(e,g){
  if(e.type==='shot'){const p=g.player,dx=e.x-p.x,dz=e.z-p.z,distance=Math.hypot(dx,dz),vol=Math.min(1,2/(1+distance*.14)),pan=Math.max(-1,Math.min(1,(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))/20));this.burst(.13,.7*vol,1800,pan);this.tone(e.weapon==='marksman'?90:140,.11,.25*vol,'triangle',pan);}
  if(e.type==='explosion'){this.burst(.7,.8,650);this.tone(65,.6,.6);}
  if(e.type==='hit'&&e.attacker===g.player?.id)this.tone(e.head?1100:700,.07,.2);
  if(e.type==='hit'&&e.id===g.player?.id)this.burst(.13,.3,500);
  if(e.type==='step')this.burst(.045,.08,800);
  if(e.type==='reload'&&e.id===g.player?.id)this.burst(.12,.18,2400);
  if(e.type==='loaded'&&e.id===g.player?.id)this.tone(400,.09,.2,'square');
  if(['buy','switch','pickup'].includes(e.type))this.tone(700,.08,.1);
  if(e.type==='plant'){this.tone(850,.3,.25);setTimeout(()=>this.tone(1100,.3,.25),180);}
  if(e.type==='end'){this.tone(e.win?650:260,.45,.2);setTimeout(()=>this.tone(e.win?850:190,.55,.2),220);}
 }
 update(g){if(g.objective.state==='planted'){const tick=Math.floor(g.objective.timer*(g.objective.timer<8?3:1));if(tick!==this.lastBeep){this.lastBeep=tick;this.tone(1000,.05,.1);}}}
}

