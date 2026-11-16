
import { layout } from './layout.js';
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function blocked(x,z,r=.35) {
 if(Math.abs(x)>layout.bounds-r||Math.abs(z)>layout.bounds-r)return true;
 return layout.walls.some(w=>Math.abs(x-w.x)<w.w/2+r&&Math.abs(z-w.z)<w.d/2+r);
}
// Ray/slab test. Vertical bounds permit firing over low cover.
export function rayBox(o,d,b,max=Infinity) {
 let lo=0,hi=max;
 for(const k of ['x','y','z']){
  const min=b[k+'0'],maxb=b[k+'1'];
  if(Math.abs(d[k])<1e-8){if(o[k]<min||o[k]>maxb)return Infinity;}
  else{let a=(min-o[k])/d[k],c=(maxb-o[k])/d[k];if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(hi<lo)return Infinity;}
 }return lo;
}
const solids=layout.walls.map(w=>({x0:w.x-w.w/2,x1:w.x+w.w/2,z0:w.z-w.d/2,z1:w.z+w.d/2,y0:0,y1:w.h}));
export function wallHit(o,d,max){let near=max;for(const w of solids)near=Math.min(near,rayBox(o,d,w,max));return near;}
export function sphereHit(o,d,x,y,z,r){
 const ax=o.x-x,ay=o.y-y,az=o.z-z,b=ax*d.x+ay*d.y+az*d.z,c=ax*ax+ay*ay+az*az-r*r,h=b*b-c;
 if(h<0)return Infinity;const t=-b-Math.sqrt(h);return t>0?t:Infinity;
}
export function canSee(a,b){
 const y=a.crouch?1.05:1.55,by=b.crouch?1:1.45,len=Math.hypot(b.x-a.x,by-y,b.z-a.z);
 return wallHit({x:a.x,y,z:a.z},{x:(b.x-a.x)/len,y:(by-y)/len,z:(b.z-a.z)/len},len)>=len-.1;
}
// Grid is built once. Search runs on bot decisions, never on rendered frames.
const nav=[],grid=new Map();
for(let z=-28;z<=28;z+=2)for(let x=-28;x<=28;x+=2)if(!blocked(x,z,.6)){const n={x,z,i:nav.length,links:[]};nav.push(n);grid.set(x+','+z,n);}
for(const n of nav)for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2]]){const t=grid.get((n.x+dx)+','+(n.z+dz));if(t&&!blocked((n.x+t.x)/2,(n.z+t.z)/2,.6))n.links.push(t.i);}
function nearest(p){let best=0,min=Infinity;for(const n of nav){const d=(n.x-p.x)**2+(n.z-p.z)**2;if(d<min){min=d;best=n.i;}}return best;}
export function route(from,to){
 const start=nearest(from),goal=nearest(to),open=[start],score=new Float32Array(nav.length).fill(Infinity),prev=new Int16Array(nav.length).fill(-1),closed=new Uint8Array(nav.length);score[start]=0;
 while(open.length){let idx=0,low=Infinity;for(let j=0;j<open.length;j++){const n=nav[open[j]],f=score[n.i]+Math.abs(n.x-nav[goal].x)+Math.abs(n.z-nav[goal].z);if(f<low){low=f;idx=j;}}
 const cur=open.splice(idx,1)[0];if(cur===goal){const out=[];let i=goal;while(i!==start){out.push({x:nav[i].x,z:nav[i].z});i=prev[i];}return out.reverse();}closed[cur]=1;
 for(const next of nav[cur].links)if(!closed[next]&&score[cur]+2<score[next]){score[next]=score[cur]+2;prev[next]=cur;if(!open.includes(next))open.push(next);}
 }return [];
}
export function moveBody(a,dx,dz){
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.2));dx/=steps;dz/=steps;
 for(let i=0;i<steps;i++){if(!blocked(a.x+dx,a.z))a.x+=dx;else a.vx=0;if(!blocked(a.x,a.z+dz))a.z+=dz;else a.vz=0;}
}

