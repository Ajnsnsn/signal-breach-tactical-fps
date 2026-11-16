/* SIGNAL BREACH — original procedural relay-station environment.
   Solid geometry comes only from the simulation's wall layout. Decorative
   structures are above those solids, on the floor, or outside the play area. */
export function buildWorld(THREE, scene, layout) {
  const P = {concrete:0xbab49a, sand:0xc8b991, dark:0x213b42, teal:0x287577,
    coral:0xbd6354, ochre:0xd6a443, white:0xeee1bd, steel:0x506669,
    sea:0x306f79, glow:0x88ffe4, sky:0xaecbc4};
  const mats = new Map(), cube = new THREE.BoxGeometry(1,1,1);
  const material = (color, roughness=.85) => {
    const key = `${color}/${roughness}`;
    if(!mats.has(key)) mats.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness:roughness<.6?.35:.03}));
    return mats.get(key);
  };
  function box(x,y,z,w,h,d,color,parent=scene) {
    const mesh=new THREE.Mesh(cube,material(color));
    mesh.position.set(x,y,z); mesh.scale.set(w,h,d);
    mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function cylinder(x,y,z,r,h,color,segments=12,parent=scene) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material(color,.55));
    mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function canvasTexture(width,height,draw) {
    const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext('2d'); draw(ctx,width,height);
    const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace; return tex;
  }
  function label(text,w,h,bg='#213b42',fg='#eee1bd',sub='') {
    return canvasTexture(1024,256,(c,W,H)=>{
      c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;
      c.fillRect(30,30,10,H-60);c.textBaseline='middle';c.font='900 108px Arial';c.fillText(text,68,H*.47);
      if(sub){c.font='600 28px Arial';c.fillText(sub,74,H*.82);}
      c.fillStyle=fg;c.fillRect(W-40,30,10,H-60);
    });
  }
  function sign(text,x,y,z,w,h,rot=0,bg,sub='') {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:label(text,w,h,bg,undefined,sub),side:THREE.DoubleSide}));
    mesh.position.set(x,y,z);mesh.rotation.y=rot;scene.add(mesh);return mesh;
  }
  function groundLabel(text,x,z,w=6,h=1.5,color='#eee1bd') {
    const tex=canvasTexture(1024,256,(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle=color;c.font='900 160px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2);});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.045,z);scene.add(mesh);return mesh;
  }
  const floorTex=canvasTexture(512,512,(c,W,H)=>{
    c.fillStyle='#b3ad91';c.fillRect(0,0,W,H);
    let seed=4812;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<3500;i++){const g=140+Math.floor(random()*45);c.fillStyle=`rgba(${g},${g},${g-20},.11)`;c.fillRect(random()*W,random()*H,1+random()*3,1+random()*3);}
    c.strokeStyle='rgba(61,74,68,.18)';c.lineWidth=2;c.strokeRect(1,1,W-2,H-2);
    c.strokeStyle='rgba(238,225,189,.16)';c.lineWidth=1;c.beginPath();c.moveTo(3,4);c.lineTo(W-3,4);c.stroke();
  });
  floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(15,15);floorTex.anisotropy=4;
  const base=box(0,-.65,0,60,1.3,60,P.dark);base.receiveShadow=true;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({map:floorTex,roughness:.98}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.005;floor.receiveShadow=true;scene.add(floor);
  const ocean=new THREE.Mesh(new THREE.PlaneGeometry(900,900),material(P.sea,.52));ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.4;scene.add(ocean);
  // Fine horizontal water bands produce a calm, graphic coastline without a shader.
  for(let n=0;n<32;n++) {
    const z=-130+n*8.5, len=55+(n*29%101);
    box((n%2?1:-1)*(70+n%5*18),-1.37,z,len,.012,.15,n%3?0x51858b:0x74a09f);
  }
  for(let i=0;i<15;i++) {
    const angle=i/15*Math.PI*2, distance=155+(i*17%65);
    const mountain=new THREE.Mesh(new THREE.ConeGeometry(21+i%5*5,18+i%4*11,4),material(i%2?0x7b9691:0x91a69a));
    mountain.position.set(Math.cos(angle)*distance,-4,Math.sin(angle)*distance);mountain.rotation.y=angle;scene.add(mountain);
  }
  const hemi=new THREE.HemisphereLight(0xd5eee9,0x4a5552,2.15);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd0a0,2.7);sun.position.set(-30,52,17);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;
  sun.shadow.camera.near=1;sun.shadow.camera.far=120;sun.shadow.normalBias=.025;sun.shadow.bias=-.00012;scene.add(sun);
  const sunlight=new THREE.Mesh(new THREE.SphereGeometry(8,20,12),new THREE.MeshBasicMaterial({color:0xffe0b2,fog:false}));sunlight.position.set(-140,90,-190);scene.add(sunlight);
  const wallColors=[P.teal,P.concrete,P.coral,P.teal,P.ochre,P.concrete];
  layout.walls.forEach((wall,i)=>{
    const {x,z,w,d,h}=wall, color=wall.color??wallColors[i%wallColors.length];
    box(x,h/2,z,w,h,d,color);
    // Concrete foundation and roof caps all remain inside the collider footprint.
    box(x,.16,z,w+.018,.31,d+.018,P.dark);
    box(x,h-.09,z,w+.025,.18,d+.025,P.white);
    if(h>2.5 && w>2 && d>2) {
      const long=w>d;
      box(x,h-.36,z,w*.98,.13,d*.98,P.dark);
      if(long) {
        for(let k=-1;k<=1;k++) {
          if(w<4 && k)continue;
          box(x+k*w*.28,h*.61,z+d/2+.015,Math.min(1.1,w*.19),.4,.025,P.dark);
          box(x+k*w*.28,h*.61+.03,z+d/2+.035,Math.min(.9,w*.16),.05,.02,P.glow);
        }
      } else {
        for(let k=-1;k<=1;k++) {
          box(x+w/2+.015,h*.61,z+k*d*.27,.025,.42,Math.min(1.1,d*.19),P.dark);
          box(x+w/2+.035,h*.61+.03,z+k*d*.27,.02,.05,Math.min(.85,d*.16),P.glow);
        }
      }
      if(i%3===0 && Math.min(w,d)>3) {
        box(x,h+.28,z,Math.min(w*.55,3),.55,Math.min(d*.55,2.3),P.steel);
        for(let k=0;k<4;k++)box(x-.75+k*.5,h+.58,z,.09,.04,Math.min(d*.4,1.8),P.dark);
      }
      if(i%4===1 && Math.min(w,d)>3) {
        cylinder(x,h+.8,z,.65,1.6,P.white);
        cylinder(x,h+1.62,z,.72,.08,P.dark);
        box(x,h+2,z,.09,.8,.09,P.steel);
      }
    } else if(h<2.6 && w>1 && d>1) {
      // Short cover reads as equipment cargo. The bands lie on its surfaces.
      box(x-w*.32,h/2,z,.09,h+.025,d+.025,P.ochre);
      box(x+w*.32,h/2,z,.09,h+.025,d+.025,P.ochre);
      box(x,h*.6,z+d/2+.018,w*.35,.3,.025,P.white);
    }
  });
  // Painted wayfinding routes leave all movement lanes unobstructed.
  for(const x of [-17,17]) {
    for(let z=20;z>=-18;z-=5)box(x,.018,z,.09,.015,2.6,x<0?P.teal:P.coral);
    for(let z of [15,1,-11]) {
      const shape=new THREE.Shape();shape.moveTo(-.6,-.5);shape.lineTo(0,.5);shape.lineTo(.6,-.5);shape.lineTo(0,-.15);shape.closePath();
      const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:x<0?P.teal:P.coral,side:THREE.DoubleSide}));
      arrow.rotation.x=-Math.PI/2;arrow.position.set(x,.03,z);scene.add(arrow);
    }
  }
  groundLabel('DEPARTURE / 04',0,25,7,1.35);
  groundLabel('A  /  WEST',-17,21,6,1.3,'#246d70');groundLabel('B  /  EAST',17,21,6,1.3,'#a55143');
  groundLabel('RELAY CONTROL',0,-25,8,1.4);
  // At each objective the floor plate and luminous arc mark interaction range.
  const site=[];
  for(const s of layout.sites) {
    const group=new THREE.Group();group.position.set(s.x,.035,s.z);scene.add(group);
    const ringMat=new THREE.MeshBasicMaterial({color:s.name==='A'?P.glow:0xffae7d,transparent:true,opacity:.82,side:THREE.DoubleSide});
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.7,2.76,64),ringMat);ring.rotation.x=-Math.PI/2;group.add(ring);
    const disk=new THREE.Mesh(new THREE.CircleGeometry(2.65,64),new THREE.MeshStandardMaterial({color:P.dark,transparent:true,opacity:.18,roughness:.9}));disk.rotation.x=-Math.PI/2;disk.position.y=-.009;group.add(disk);
    for(let j=0;j<4;j++) {
      const angle=j*Math.PI/2,mark=box(Math.sin(angle)*2.2,.008,Math.cos(angle)*2.2,.55,.015,.18,P.ochre,group);mark.rotation.y=angle;
    }
    groundLabel(s.name,s.x,s.z,2.7,2.3,s.name==='A'?'#d0f6db':'#ffd9b5');
    groundLabel('UPLINK',s.x,s.z+1.7,2.5,.5);
    site.push({group,ring,material:ringMat});
  }
  // Edge markings and sea-facing hazard rails are beyond the collision boundary.
  for(let i=-28;i<=28;i+=3) {
    box(i,.025,-29.6,1.5,.025,.23,i%2?P.dark:P.ochre);
    box(i,.025,29.6,1.5,.025,.23,i%2?P.dark:P.ochre);
    box(-29.6,.025,i,.23,.025,1.5,i%2?P.dark:P.ochre);
    box(29.6,.025,i,.23,.025,1.5,i%2?P.dark:P.ochre);
  }
  for(const side of [-1,1]) {
    for(let z=-30;z<=30;z+=6)box(side*30.3,.65,z,.09,1.4,.09,P.dark);
    box(side*30.3,1.2,0,.08,.08,60,P.ochre);
    box(side*30.3,.62,0,.07,.07,60,P.dark);
  }
  // Original antennas, maintenance crane, and distant utility islands establish scale.
  function mast(x,z,height) {
    box(x,-.35,z,6,.8,6,P.dark);cylinder(x,height/2,z,.23,height,P.white);
    for(let y=3;y<height;y+=4){box(x,y,z,3,.16,.16,P.steel);box(x,y,z,.16,.16,2.8,P.steel);}
    for(let y=height-4;y<=height;y+=2) {
      const dish=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.7,.35,20),material(P.white,.5));dish.rotation.z=Math.PI*.5;dish.position.set(x+.8,y,z);scene.add(dish);
    }
    const beacon=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:0xff8064}));beacon.position.set(x,height+.2,z);scene.add(beacon);
  }
  mast(-38,-23,18);mast(38,-32,24);
  box(0,1.8,-34,29,4,5,P.teal);box(0,4,-34,30,.3,6,P.white);
  sign('SIGNAL  /  04',0,3,-31.47,13,2,0,'#275f62','COASTAL RELAY AUTHORITY');
  for(let x=-11;x<=11;x+=5.5)box(x,1.6,-31.45,3,.8,.04,P.dark);
  box(-45,10,13,1,21,1,P.ochre);box(-40,20,13,14,.8,.8,P.ochre);box(-36,15,13,.08,10,.08,P.dark);
  box(-36,9.9,13,1.2,.2,1.2,P.dark);
  for(let z=6;z<24;z+=6)box(-43,1.5,z,4,4,5,z%12?P.coral:P.teal);
  // Service lights on the outer seawall.
  for(const x of [-30.4,30.4]) for(const z of [-28,28]) {
    box(x,2.8,z,.09,5.6,.09,P.dark);box(x,5.45,z,.7,.16,.45,P.white);
    const lamp=new THREE.Mesh(new THREE.PlaneGeometry(.5,.3),new THREE.MeshBasicMaterial({color:0xffdda5,side:THREE.DoubleSide}));
    lamp.rotation.x=Math.PI/2;lamp.position.set(x,5.35,z);scene.add(lamp);
  }
  // Bake static box transforms into material batches: the same architecture, fewer draw calls.
  scene.updateMatrixWorld(true);
  const batches=new Map();
  scene.traverse(object=>{if(object.isMesh&&object.geometry===cube){let items=batches.get(object.material);if(!items){items=[];batches.set(object.material,items);}items.push(object);}});
  for(const [mat,items] of batches){const instances=new THREE.InstancedMesh(cube,mat,items.length);instances.castShadow=true;instances.receiveShadow=true;items.forEach((object,index)=>{instances.setMatrixAt(index,object.matrixWorld);object.parent.remove(object);});instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();scene.add(instances);}
  return {site, sun, update(time) {for(let i=0;i<site.length;i++)site[i].material.opacity=.62+Math.sin(time*2+i)*.12;}};
}
