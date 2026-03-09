const $ = (id) => document.getElementById(id);
const gameGrid = $("gameGrid");
const gameHost = $("gameHost");
const controls = $("controls");
const activeTitle = $("activeTitle");
const activeDesc = $("activeDesc");
const onlineBadge = $("onlineBadge");
const netMode = $("netMode");
const searchInput = $("searchInput");
const tagRow = $("tagRow");
const metaBar = $("metaBar");
const countBadge = $("countBadge");

const state = { currentGame: null, cleanup: null, activeTag: "全部", query: "" };
const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

function setupNetworkAwareMode() {
  const updateOnline = () => {
    onlineBadge.textContent = navigator.onLine ? "在线" : "离线";
    onlineBadge.style.background = navigator.onLine ? "rgba(44,207,135,.2)" : "rgba(255,120,97,.28)";
  };
  const updateQuality = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || ["slow-2g", "2g"].includes(conn.effectiveType))) {
      netMode.textContent = "省流模式";
      document.body.classList.add("low-bandwidth");
    } else {
      netMode.textContent = "标准模式";
      document.body.classList.remove("low-bandwidth");
    }
  };
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  if (navigator.connection) navigator.connection.addEventListener("change", updateQuality);
  updateOnline(); updateQuality();
}

function bindKeys(map) {
  const kd = (e) => { if (map[e.key]) { e.preventDefault(); map[e.key](true); } };
  const ku = (e) => { if (map[e.key]) { e.preventDefault(); map[e.key](false); } };
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
}

function setMeta(t) { metaBar.textContent = t; }
function addControl(label, onClick, alt = false) { const b = document.createElement("button"); b.textContent = label; if (alt) b.classList.add("alt"); b.onclick = onClick; controls.appendChild(b); }
function createCanvas(w, h) { const wrap = document.createElement("div"); wrap.className = "canvas-wrap"; const c = document.createElement("canvas"); c.width = w; c.height = h; wrap.appendChild(c); gameHost.appendChild(wrap); return c; }
function createPanel() { const p = document.createElement("div"); p.className = "panel-box"; gameHost.appendChild(p); return p; }

function clearGame() {
  if (typeof state.cleanup === "function") state.cleanup();
  state.cleanup = null;
  controls.innerHTML = "";
  gameHost.innerHTML = "";
  metaBar.textContent = "";
}

function drawOverlay(x, w, h, msg) {
  x.fillStyle = "rgba(0,0,0,.5)";
  x.fillRect(0, 0, w, h);
  x.fillStyle = "#fff";
  x.font = "32px Segoe UI";
  x.fillText(msg, w * 0.3, h * 0.52);
}

function mountFireIce() {
  const c = createCanvas(760, 420), x = c.getContext("2d");
  setMeta("红灵 WASD，蓝灵 方向键，两人到门内通关");
  const floors = [{x:0,y:380,w:760,h:40},{x:60,y:320,w:180,h:16},{x:285,y:280,w:180,h:16},{x:520,y:240,w:180,h:16},{x:510,y:155,w:160,h:16}];
  const lava = {x:240,y:380,w:120,h:40}, water = {x:390,y:380,w:120,h:40}, goalR = {x:560,y:115,w:32,h:40}, goalB = {x:605,y:115,w:32,h:40};
  const down = {};
  const mk = (x0,y0,col)=>({x:x0,y:y0,vx:0,vy:0,w:24,h:30,g:false,done:false,col});
  let r = mk(100,340,"#ff6b6b"), b = mk(160,340,"#59bfff");
  const hit = (a,b1)=>a.x < b1.x+b1.w && a.x+a.w>b1.x && a.y < b1.y+b1.h && a.y+a.h>b1.y;
  const off = bindKeys({a:v=>down.a=v,d:v=>down.d=v,w:v=>down.w=v,ArrowLeft:v=>down.l=v,ArrowRight:v=>down.r=v,ArrowUp:v=>down.u=v});
  [["红左",()=>down.a=!down.a],["红右",()=>down.d=!down.d],["红跳",()=>down.w=true],["蓝左",()=>down.l=!down.l],["蓝右",()=>down.r=!down.r],["蓝跳",()=>down.u=true],["重开",()=>startGame("fireice"),true]].forEach(i=>addControl(i[0],i[1],i[2]));
  const step=(p,l,r1,j)=>{ if(p.done)return; p.vx=l?-2.8:r1?2.8:0; if(j&&p.g)p.vy=-8.4; p.vy+=0.4; p.x=clamp(p.x+p.vx,0,760-p.w); p.y+=p.vy; p.g=false; floors.forEach(f=>{ if(hit(p,f)&&p.vy>=0&&p.y+p.h-p.vy<=f.y+8){ p.y=f.y-p.h; p.vy=0; p.g=true; } }); };
  let raf=0;
  const loop=()=>{
    const jr=down.w,jb=down.u; down.w=false; down.u=false;
    step(r,down.a,down.d,jr); step(b,down.l,down.r,jb);
    if(hit(r,water)||hit(b,lava)||r.y>420||b.y>420){ r=mk(100,340,"#ff6b6b"); b=mk(160,340,"#59bfff"); }
    r.done=hit(r,goalR); b.done=hit(b,goalB);
    x.fillStyle="#091127"; x.fillRect(0,0,760,420);
    x.fillStyle="#f39c33"; x.fillRect(lava.x,lava.y,lava.w,lava.h);
    x.fillStyle="#3b91ff"; x.fillRect(water.x,water.y,water.w,water.h);
    x.fillStyle="#8ea6d9"; floors.forEach(f=>x.fillRect(f.x,f.y,f.w,f.h));
    x.fillStyle="#ff7d6b"; x.fillRect(goalR.x,goalR.y,goalR.w,goalR.h);
    x.fillStyle="#73cbff"; x.fillRect(goalB.x,goalB.y,goalB.w,goalB.h);
    x.fillStyle=r.done?"#ffd4cd":r.col; x.fillRect(r.x,r.y,r.w,r.h);
    x.fillStyle=b.done?"#d5ebff":b.col; x.fillRect(b.x,b.y,b.w,b.h);
    x.fillStyle="#d8e6ff"; x.font="18px Segoe UI"; x.fillText(r.done&&b.done?"通关成功":"红灵怕水 蓝灵怕火",18,30);
    raf=requestAnimationFrame(loop);
  }; loop(); return ()=>{ cancelAnimationFrame(raf); off(); };
}

function mountSnake() {
  const c=createCanvas(640,640),x=c.getContext("2d"); setMeta("方向键控制，吃星核涨分");
  let snake=[{x:8,y:8}],dir={x:1,y:0},food={x:12,y:9},score=0;
  const setDir=(dx,dy)=>dir={x:dx,y:dy};
  const off=bindKeys({ArrowUp:()=>setDir(0,-1),ArrowDown:()=>setDir(0,1),ArrowLeft:()=>setDir(-1,0),ArrowRight:()=>setDir(1,0)});
  [["上",0,-1],["下",0,1],["左",-1,0],["右",1,0]].forEach(k=>addControl(k[0],()=>setDir(k[1],k[2]))); addControl("重开",()=>startGame("snake"),true);
  const timer=setInterval(()=>{
    const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(h.x<0||h.y<0||h.x>=20||h.y>=20||snake.some(s=>s.x===h.x&&s.y===h.y)){ drawOverlay(x,640,640,`结束 ${score}`); clearInterval(timer); return; }
    snake.unshift(h); if(h.x===food.x&&h.y===food.y){ score+=10; food={x:rand(0,19),y:rand(0,19)}; } else snake.pop();
    x.fillStyle="#020917"; x.fillRect(0,0,640,640); x.fillStyle="#ff5d73"; x.fillRect(food.x*32,food.y*32,30,30); x.fillStyle="#43d9b8"; snake.forEach(s=>x.fillRect(s.x*32,s.y*32,30,30));
    x.fillStyle="#d4e6ff"; x.font="20px Segoe UI"; x.fillText(`分数 ${score}`,12,28);
  },120);
  return ()=>{ clearInterval(timer); off(); };
}

function mountRunner() {
  const c=createCanvas(760,360),x=c.getContext("2d"); setMeta("空格/点击跳跃");
  let y=280,vy=0,ob=760,speed=6,score=0,over=false,raf=0; const jump=()=>{ if(y>=279)vy=-12; };
  const off=bindKeys({" ":()=>jump(),Spacebar:()=>jump()}); c.addEventListener("pointerdown",jump);
  addControl("跳跃",jump); addControl("重开",()=>startGame("runner"),true);
  const loop=()=>{ if(over){ drawOverlay(x,760,360,`结束 ${score}`); return; } vy+=0.65; y=Math.min(280,y+vy); if(y===280)vy=0; ob-=speed; if(ob<-30){ob=760+rand(80,220); speed+=0.1; score++;}
    if(ob<138&&ob+26>110&&y+30>276)over=true; x.fillStyle="#081326"; x.fillRect(0,0,760,360); x.fillStyle="#132949"; x.fillRect(0,310,760,50); x.fillStyle="#ffd166"; x.fillRect(110,y,28,30); x.fillStyle="#ff5d73"; x.fillRect(ob,276,26,34); x.fillStyle="#d3e5ff"; x.font="20px Segoe UI"; x.fillText(`分数 ${score}`,14,30); raf=requestAnimationFrame(loop); };
  loop(); return ()=>{ cancelAnimationFrame(raf); off(); };
}

function mountFlappy() {
  const c=createCanvas(760,420),x=c.getContext("2d"); setMeta("点击/空格上升穿管道");
  let y=200,vy=0,pipes=[{x:760,gap:180},{x:1120,gap:230}],score=0,over=false,raf=0; const flap=()=>vy=-7;
  const off=bindKeys({" ":()=>flap(),Spacebar:()=>flap()}); c.addEventListener("pointerdown",flap); addControl("拍翼",flap); addControl("重开",()=>startGame("flappy"),true);
  const loop=()=>{ if(over){ drawOverlay(x,760,420,`结束 ${score}`); return; } vy+=0.45; y+=vy; x.fillStyle="#081427"; x.fillRect(0,0,760,420); x.fillStyle="#6dd3ff"; x.fillRect(120,y,30,24);
    pipes.forEach(p=>{ p.x-=3.4; x.fillStyle="#2dcf8f"; x.fillRect(p.x,0,70,p.gap-70); x.fillRect(p.x,p.gap+90,70,420-p.gap-90); if(p.x+70<0){ p.x=860; p.gap=rand(140,260); score++; } if(150>p.x&&120<p.x+70&&(y<p.gap-70||y+24>p.gap+90))over=true; });
    if(y<0||y+24>420)over=true; x.fillStyle="#d6e5ff"; x.font="22px Segoe UI"; x.fillText(`分数 ${score}`,14,30); raf=requestAnimationFrame(loop); };
  loop(); return ()=>{ cancelAnimationFrame(raf); off(); };
}
function mountPong() {
  const c=createCanvas(760,420),x=c.getContext("2d"); setMeta("W/S 或触控移动挡板");
  let p1=170,p2=170,bx=380,by=210,vx=4,vy=3,s1=0,s2=0,raf=0; const down={};
  const off=bindKeys({w:v=>down.w=v,s:v=>down.s=v}); c.addEventListener("pointermove",e=>{const r=c.getBoundingClientRect(); p1=((e.clientY-r.top)/r.height)*420-40;});
  addControl("上",()=>p1-=24); addControl("下",()=>p1+=24); addControl("重开",()=>startGame("pong"),true);
  const loop=()=>{ p1+=down.w?-5:down.s?5:0; p1=clamp(p1,0,340); p2+=(by-(p2+40))*0.08; p2=clamp(p2,0,340); bx+=vx; by+=vy; if(by<0||by>420)vy*=-1;
    if(bx<30&&by>p1&&by<p1+80)vx=Math.abs(vx)+.14; if(bx>730&&by>p2&&by<p2+80)vx=-Math.abs(vx)-.14; if(bx<0){s2++; bx=380;by=210;vx=4;vy=rand(-3,3);} if(bx>760){s1++; bx=380;by=210;vx=-4;vy=rand(-3,3);} 
    x.fillStyle="#050d1d"; x.fillRect(0,0,760,420); x.fillStyle="#2b4d8a"; for(let i=0;i<420;i+=24)x.fillRect(378,i,4,14); x.fillStyle="#4dd4ff"; x.fillRect(12,p1,14,80); x.fillStyle="#ff8d59"; x.fillRect(734,p2,14,80); x.fillStyle="#fff"; x.beginPath(); x.arc(bx,by,9,0,Math.PI*2); x.fill(); x.font="28px Segoe UI"; x.fillText(`${s1}:${s2}`,356,40);
    raf=requestAnimationFrame(loop); }; loop(); return ()=>{ cancelAnimationFrame(raf); off(); };
}

function mountBreakout(){
  const c=createCanvas(760,460),x=c.getContext("2d"); setMeta("左右挡板反弹球清砖");
  let p=330,bx=380,by=300,vx=4,vy=-4,score=0,raf=0; const bricks=[]; for(let r=0;r<6;r++)for(let i=0;i<10;i++)bricks.push({x:30+i*70,y:30+r*34,w:62,h:24,hp:1}); const down={};
  const off=bindKeys({ArrowLeft:v=>down.l=v,ArrowRight:v=>down.r=v}); addControl("左",()=>p-=24); addControl("右",()=>p+=24); addControl("重开",()=>startGame("breakout"),true);
  const loop=()=>{ p+=down.l?-7:down.r?7:0; p=clamp(p,0,640); bx+=vx; by+=vy; if(bx<8||bx>752)vx*=-1; if(by<8)vy*=-1; if(by>460){drawOverlay(x,760,460,`失败 ${score}`); return;} if(by>424&&bx>p&&bx<p+120){vy=-Math.abs(vy); vx+=(bx-p-60)*.03;}
    for(const b of bricks){ if(b.hp&&bx>b.x&&bx<b.x+b.w&&by>b.y&&by<b.y+b.h){b.hp=0;vy*=-1;score+=10;break;} } if(!bricks.some(b=>b.hp)){drawOverlay(x,760,460,`清屏 ${score}`); return;}
    x.fillStyle="#050d1d"; x.fillRect(0,0,760,460); bricks.forEach(b=>{if(b.hp){x.fillStyle=`hsl(${(b.x+b.y)%360} 90% 60%)`;x.fillRect(b.x,b.y,b.w,b.h);}}); x.fillStyle="#4cc9f0";x.fillRect(p,434,120,12);x.fillStyle="#fff";x.beginPath();x.arc(bx,by,8,0,Math.PI*2);x.fill();x.fillStyle="#d8e5ff";x.font="20px Segoe UI";x.fillText(`得分 ${score}`,14,28);
    raf=requestAnimationFrame(loop); }; loop(); return ()=>{cancelAnimationFrame(raf);off();};
}

function mountShooter(){
  const c=createCanvas(760,480),x=c.getContext("2d"); setMeta("左右移动+发射");
  let px=370,score=0,dir=1,ended=false,raf=0; const bullets=[],enemies=[]; for(let r=0;r<4;r++)for(let i=0;i<9;i++)enemies.push({x:80+i*64,y:50+r*52,alive:true}); const down={};
  const shoot=()=>bullets.push({x:px+16,y:430,vy:-8}); const off=bindKeys({ArrowLeft:v=>down.l=v,ArrowRight:v=>down.r=v," ":v=>v&&shoot(),Spacebar:v=>v&&shoot()});
  addControl("左",()=>px-=20); addControl("右",()=>px+=20); addControl("发射",shoot); addControl("重开",()=>startGame("shooter"),true);
  const end=(m)=>{ended=true;drawOverlay(x,760,480,m);};
  const loop=()=>{ if(ended)return; px+=down.l?-5:down.r?5:0; px=clamp(px,0,728); const live=enemies.filter(e=>e.alive); if(!live.length){end(`胜利 ${score}`);return;} const minX=Math.min(...live.map(e=>e.x)),maxX=Math.max(...live.map(e=>e.x)); if(maxX>730||minX<20){dir*=-1;live.forEach(e=>e.y+=18);} live.forEach(e=>{e.x+=dir*.8;if(e.y>410)end("敌机压境");}); bullets.forEach(b=>b.y+=b.vy);
    for(const b of bullets)for(const e of live){ if(e.alive&&b.x>e.x&&b.x<e.x+28&&b.y>e.y&&b.y<e.y+24){e.alive=false;b.y=-20;score+=12;} }
    x.fillStyle="#050d1d";x.fillRect(0,0,760,480);x.fillStyle="#50fa7b";x.fillRect(px,442,34,20);x.fillStyle="#7ec8ff";live.forEach(e=>x.fillRect(e.x,e.y,28,22));x.fillStyle="#ffdf6e";bullets.forEach(b=>x.fillRect(b.x,b.y,4,12));x.fillStyle="#d8e5ff";x.font="20px Segoe UI";x.fillText(`得分 ${score}`,14,28);
    raf=requestAnimationFrame(loop); }; loop(); return ()=>{cancelAnimationFrame(raf);off();};
}

function mountDodge(){
  const c=createCanvas(760,420),x=c.getContext("2d"); setMeta("左右躲陨石");
  let px=370,t=0,score=0,raf=0; const rocks=[],down={}; const off=bindKeys({ArrowLeft:v=>down.l=v,ArrowRight:v=>down.r=v});
  addControl("左",()=>px-=24); addControl("右",()=>px+=24); addControl("重开",()=>startGame("dodge"),true);
  const loop=()=>{ t++; px+=down.l?-6:down.r?6:0; px=clamp(px,0,730); if(t%20===0)rocks.push({x:rand(0,740),y:-10,vy:2+Math.random()*3,s:rand(10,20)}); rocks.forEach(r=>r.y+=r.vy); score+=.15;
    const hit=rocks.some(r=>Math.abs((r.x+r.s/2)-(px+15))<r.s&&Math.abs((r.y+r.s/2)-390)<r.s);
    x.fillStyle="#061328";x.fillRect(0,0,760,420);x.fillStyle="#24487d";x.fillRect(0,400,760,20);x.fillStyle="#76e4ff";x.fillRect(px,376,30,24);x.fillStyle="#ff9966";rocks.forEach(r=>x.fillRect(r.x,r.y,r.s,r.s));x.fillStyle="#d5e6ff";x.font="20px Segoe UI";x.fillText(`生存分 ${Math.floor(score)}`,14,28);
    if(hit){drawOverlay(x,760,420,`被击中 ${Math.floor(score)}`);return;} raf=requestAnimationFrame(loop);
  }; loop(); return ()=>{cancelAnimationFrame(raf);off();};
}

function mountSimpleBoard(setup){
  const box=createPanel(); const info=document.createElement("div"); info.className="info"; box.appendChild(info);
  return setup(box,info);
}

function mount2048(){
  setMeta("方向键或按钮滑动");
  return mountSimpleBoard((box,info)=>{
    const g=document.createElement("div"); g.className="ui-grid cols-4"; g.style.gap="10px"; box.appendChild(g);
    const colors={0:"#1c2f54",2:"#e7ddcc",4:"#f0cf99",8:"#f79a72",16:"#ff7d66",32:"#ff5d73",64:"#ff3e51",128:"#f7ca65",256:"#f7ba4e",512:"#f7ab38",1024:"#f7992e",2048:"#7effa5"};
    let b=Array.from({length:4},()=>Array(4).fill(0));
    const spawn=()=>{const e=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(!b[r][c])e.push([r,c]);if(!e.length)return;const p=e[rand(0,e.length-1)];b[p[0]][p[1]]=Math.random()<.9?2:4;};
    const slide=a=>{const t=a.filter(Boolean);for(let i=0;i<t.length-1;i++)if(t[i]===t[i+1]){t[i]*=2;t[i+1]=0;}const z=t.filter(Boolean);while(z.length<4)z.push(0);return z;};
    const rot=()=>b=b[0].map((_,i)=>b.map(r=>r[i]).reverse());
    const move=d=>{const o=JSON.stringify(b);if(d==="left")b=b.map(slide);if(d==="up"){rot();b=b.map(slide);rot();rot();rot();}if(d==="right"){rot();rot();b=b.map(slide);rot();rot();}if(d==="down"){rot();rot();rot();b=b.map(slide);rot();}if(JSON.stringify(b)!==o)spawn();render();};
    const render=()=>{g.innerHTML="";info.textContent=`当前最高 ${Math.max(...b.flat())}`;b.flat().forEach(n=>{const d=document.createElement("button");d.className="cell-btn";d.style.background=colors[n]||"#1c2f54";d.style.color=n<=4?"#2b2b2b":"#fff";d.style.fontSize="1.2rem";d.textContent=n||"";g.appendChild(d);});};
    const off=bindKeys({ArrowLeft:()=>move("left"),ArrowRight:()=>move("right"),ArrowUp:()=>move("up"),ArrowDown:()=>move("down")});
    [["上","up"],["下","down"],["左","left"],["右","right"]].forEach(k=>addControl(k[0],()=>move(k[1]))); addControl("重开",()=>startGame("2048"),true);
    spawn();spawn();render(); return ()=>off();
  });
}

function mountTicTacToe(){ setMeta("你执X，电脑执O"); return mountSimpleBoard((box,info)=>{const g=document.createElement("div");g.className="ui-grid";g.style.gridTemplateColumns="repeat(3,1fr)";box.appendChild(g); let b=Array(9).fill(""),over=false; const w=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; const j=()=>{for(const a of w)if(b[a[0]]&&b[a[0]]===b[a[1]]&&b[a[1]]===b[a[2]])return b[a[0]];return b.every(Boolean)?"平":"";}; const r=()=>{g.innerHTML=""; for(let i=0;i<9;i++){const bt=document.createElement("button");bt.className="cell-btn";bt.style.fontSize="1.5rem";bt.textContent=b[i];bt.onclick=()=>{if(over||b[i])return;b[i]="X";let m=j();if(!m){const e=b.map((v,idx)=>v?null:idx).filter(v=>v!==null);if(e.length)b[e[rand(0,e.length-1)]]="O";m=j();}if(m){over=true;info.textContent=m==="平"?"平局":`${m}获胜`;}r();};g.appendChild(bt);} if(!over)info.textContent="你的回合";}; addControl("重开",()=>startGame("ttt"),true); r(); return ()=>{}; }); }

function mountConnect4(){ setMeta("双人轮流下子，连4胜"); return mountSimpleBoard((box,info)=>{const g=document.createElement("div");g.className="ui-grid";g.style.gridTemplateColumns="repeat(7,1fr)";box.appendChild(g); let b=Array.from({length:6},()=>Array(7).fill("")),turn="红",over=false; const ds=[[1,0],[0,1],[1,1],[1,-1]]; const ck=()=>{for(let r=0;r<6;r++)for(let c=0;c<7;c++){if(!b[r][c])continue;for(const d of ds){let ok=true;for(let k=1;k<4;k++){const nr=r+d[0]*k,nc=c+d[1]*k;if(nr<0||nr>=6||nc<0||nc>=7||b[nr][nc]!==b[r][c])ok=false;}if(ok)return b[r][c];}}return b.flat().every(Boolean)?"平":"";}; const drop=c=>{if(over)return;for(let r=5;r>=0;r--)if(!b[r][c]){b[r][c]=turn;const m=ck();if(m){over=true;info.textContent=m==="平"?"平局":`${m}获胜`;}else{turn=turn==="红"?"黄":"红";info.textContent=`当前 ${turn}`;}re();break;}}; const re=()=>{g.innerHTML="";for(let r=0;r<6;r++)for(let c=0;c<7;c++){const bt=document.createElement("button");bt.className="cell-btn";const v=b[r][c];bt.style.background=v==="红"?"#ff6b6b":v==="黄"?"#ffd166":"#1a2b4d";bt.onclick=()=>drop(c);g.appendChild(bt);} }; info.textContent=`当前 ${turn}`; addControl("重开",()=>startGame("c4"),true); re(); return ()=>{}; }); }
function mountMinesweeper(){ setMeta("左键翻开，右键插旗"); return mountSimpleBoard((box,info)=>{const g=document.createElement("div");g.className="ui-grid cols-8";box.appendChild(g); const N=8,M=10; let m=Array.from({length:N},()=>Array(N).fill(0)),o=Array.from({length:N},()=>Array(N).fill(false)),f=Array.from({length:N},()=>Array(N).fill(false)),over=false; for(let i=0;i<M;i++){let r,c;do{r=rand(0,N-1);c=rand(0,N-1);}while(m[r][c]);m[r][c]=1;} const ct=(r,c)=>{let n=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<N&&nc>=0&&nc<N)n+=m[nr][nc];}return n;}; const fl=(r,c)=>{if(r<0||r>=N||c<0||c>=N||o[r][c]||f[r][c])return;o[r][c]=true;if(ct(r,c)===0&&!m[r][c])for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)fl(r+dr,c+dc);}; const re=()=>{g.innerHTML="";let op=0;for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(o[r][c])op++;const bt=document.createElement("button");bt.className="cell-btn";bt.style.minHeight="36px";if(o[r][c]){bt.style.background="#dbe8ff";bt.style.color="#122a4d";bt.textContent=m[r][c]?"💣":ct(r,c)||"";}else bt.textContent=f[r][c]?"🚩":"";bt.onclick=()=>{if(over||f[r][c])return;if(m[r][c]){o=o.map((row,ri)=>row.map((v,ci)=>v||m[ri][ci]));over=true;info.textContent="踩雷了";}else{fl(r,c);if(op>=N*N-M-1){over=true;info.textContent="排雷成功";}}re();};bt.oncontextmenu=(e)=>{e.preventDefault();if(over||o[r][c])return;f[r][c]=!f[r][c];re();};g.appendChild(bt);} }; info.textContent="目标:找出10颗雷"; addControl("重开",()=>startGame("mine"),true); re(); return ()=>{}; }); }
function mountMemory(){ setMeta("翻两张牌，找出全部配对"); return mountSimpleBoard((box,info)=>{const g=document.createElement("div");g.className="ui-grid";g.style.gridTemplateColumns="repeat(4,1fr)";box.appendChild(g); const v=["A","A","B","B","C","C","D","D","E","E","F","F","G","G","H","H"].sort(()=>Math.random()-.5); let o=[],d=Array(16).fill(false),lock=false,s=0; const re=()=>{g.innerHTML="";for(let i=0;i<16;i++){const bt=document.createElement("button");bt.className="cell-btn";bt.style.minHeight="62px";const sh=d[i]||o.includes(i);bt.textContent=sh?v[i]:"?";bt.onclick=()=>{if(lock||sh||o.length===2)return;o.push(i);if(o.length===2){s++;if(v[o[0]]===v[o[1]]){d[o[0]]=d[o[1]]=true;o=[];if(d.every(Boolean))info.textContent=`完成 步数 ${s}`;}else{lock=true;setTimeout(()=>{o=[];lock=false;re();},650);}}if(!d.every(Boolean))info.textContent=`步数 ${s}`;re();};g.appendChild(bt);} }; info.textContent="开始配对"; addControl("重开",()=>startGame("memory"),true); re(); return ()=>{}; }); }
function mountSimon(){ setMeta("记住闪烁顺序并复现"); return mountSimpleBoard((box,info)=>{const pads=document.createElement("div");pads.className="ui-grid";pads.style.gridTemplateColumns="repeat(2,1fr)";box.appendChild(pads); const cs=["#ff6b6b","#ffd166","#4cc9f0","#95d36f"],nodes=[],seq=[];let idx=0,ready=false; const bl=i=>{nodes[i].style.opacity="1";setTimeout(()=>nodes[i].style.opacity=".65",260);}; const nx=()=>{ready=false;idx=0;seq.push(rand(0,3));info.textContent=`第 ${seq.length} 轮`;seq.forEach((v,i)=>setTimeout(()=>bl(v),380*(i+1)));setTimeout(()=>ready=true,380*(seq.length+1));}; const tp=i=>{if(!ready)return;bl(i);if(i!==seq[idx]){info.textContent=`失败 最高 ${seq.length-1} 轮`;ready=false;return;}idx++;if(idx===seq.length)setTimeout(nx,600);}; for(let i=0;i<4;i++){const bt=document.createElement("button");bt.className="cell-btn";bt.style.minHeight="100px";bt.style.background=cs[i];bt.style.opacity=".65";bt.onclick=()=>tp(i);nodes.push(bt);pads.appendChild(bt);} addControl("开始",()=>{seq.length=0;nx();}); addControl("重开",()=>startGame("simon"),true); info.textContent="点击开始"; return ()=>{}; }); }
function mountWhack(){ setMeta("30秒限时打地鼠"); return mountSimpleBoard((box,info)=>{const g=document.createElement("div");g.className="ui-grid";g.style.gridTemplateColumns="repeat(3,1fr)";box.appendChild(g); const cells=Array.from({length:9},()=>document.createElement("button"));cells.forEach(b=>{b.className="cell-btn";b.style.minHeight="72px";g.appendChild(b);}); let s=0,l=30,idx=-1,t1=null,t2=null; const re=()=>{info.textContent=`分数 ${s} | ${l}s`;cells.forEach((b,i)=>{b.textContent=i===idx?"🐹":"";b.onclick=()=>{if(i===idx){s++;idx=-1;re();}};});}; const st=()=>{clearInterval(t1);clearInterval(t2);s=0;l=30;t1=setInterval(()=>{idx=rand(0,8);re();},550);t2=setInterval(()=>{l--;if(l<=0){clearInterval(t1);clearInterval(t2);idx=-1;info.textContent=`结束 总分 ${s}`;}else re();},1000);re();}; addControl("开始",st);addControl("重开",()=>startGame("whack"),true);re();return ()=>{clearInterval(t1);clearInterval(t2);}; }); }
function mountFlood(){ setMeta("选颜色统一棋盘"); return mountSimpleBoard((box,info)=>{const bd=document.createElement("div");bd.className="ui-grid";bd.style.gridTemplateColumns="repeat(10,1fr)";const bar=document.createElement("div");bar.className="controls";box.append(bd,bar); const p=["#ff6b6b","#ffd166","#4cc9f0","#95d36f","#c38bff","#ff9f68"]; let b=Array.from({length:10},()=>Array.from({length:10},()=>rand(0,p.length-1))),step=0; const fl=t=>{const f=b[0][0];if(f===t)return;const q=[[0,0]],s=new Set(["0,0"]);while(q.length){const [r,c]=q.shift();if(b[r][c]!==f)continue;b[r][c]=t;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const nr=r+d[0],nc=c+d[1],k=`${nr},${nc}`;if(nr>=0&&nr<10&&nc>=0&&nc<10&&!s.has(k)){s.add(k);q.push([nr,nc]);}});}step++;re();}; const re=()=>{bd.innerHTML="";b.flat().forEach(v=>{const d=document.createElement("button");d.className="cell-btn";d.style.minHeight="24px";d.style.background=p[v];bd.appendChild(d);});bar.innerHTML="";p.forEach((c,i)=>{const bt=document.createElement("button");bt.style.background=c;bt.textContent=String(i+1);bt.onclick=()=>fl(i);bar.appendChild(bt);});const done=b.flat().every(v=>v===b[0][0]);info.textContent=done?`完成 共${step}步`:`步数 ${step}`;}; addControl("重开",()=>startGame("flood"),true); re(); return ()=>{}; }); }
function mountMaze(){ const c=createCanvas(640,640),x=c.getContext("2d"); setMeta("方向键移动到右下终点"); const N=16,cell=40,w=Array.from({length:N},()=>Array(N).fill(0)); for(let r=0;r<N;r++)for(let c1=0;c1<N;c1++)if(Math.random()<.24)w[r][c1]=1; w[0][0]=0; w[N-1][N-1]=0; let p={r:0,c:0},st=Date.now(); const dr=()=>{x.fillStyle="#081326";x.fillRect(0,0,640,640);for(let r=0;r<N;r++)for(let c1=0;c1<N;c1++){x.fillStyle=w[r][c1]?"#26497f":"#0f1f3f";x.fillRect(c1*cell,r*cell,cell-1,cell-1);}x.fillStyle="#4dffae";x.fillRect((N-1)*cell+8,(N-1)*cell+8,24,24);x.fillStyle="#ffd166";x.fillRect(p.c*cell+8,p.r*cell+8,24,24);if(p.r===N-1&&p.c===N-1)drawOverlay(x,640,640,`通关 ${((Date.now()-st)/1000).toFixed(1)}s`);}; const mv=(dr1,dc1)=>{const nr=p.r+dr1,nc=p.c+dc1;if(nr<0||nr>=N||nc<0||nc>=N||w[nr][nc])return;p={r:nr,c:nc};dr();}; const off=bindKeys({ArrowUp:()=>mv(-1,0),ArrowDown:()=>mv(1,0),ArrowLeft:()=>mv(0,-1),ArrowRight:()=>mv(0,1)}); [["上",-1,0],["下",1,0],["左",0,-1],["右",0,1]].forEach(k=>addControl(k[0],()=>mv(k[1],k[2]))); addControl("重开",()=>startGame("maze"),true); dr(); return ()=>off(); }
function mountSliding(){ setMeta("把数字按1-8复原"); return mountSimpleBoard((box,info)=>{const g=document.createElement("div");g.className="ui-grid";g.style.gridTemplateColumns="repeat(3,1fr)";box.appendChild(g); let a=[1,2,3,4,5,6,7,8,0]; for(let i=0;i<70;i++){const z=a.indexOf(0),r=Math.floor(z/3),c=z%3,o=[[1,0],[-1,0],[0,1],[0,-1]].map(d=>[r+d[0],c+d[1]]).filter(p=>p[0]>=0&&p[0]<3&&p[1]>=0&&p[1]<3),q=o[rand(0,o.length-1)],ni=q[0]*3+q[1];[a[z],a[ni]]=[a[ni],a[z]];} const win=()=>a.join(",")==="1,2,3,4,5,6,7,8,0"; const ck=i=>{const z=a.indexOf(0),r1=Math.floor(i/3),c1=i%3,r2=Math.floor(z/3),c2=z%3;if(Math.abs(r1-r2)+Math.abs(c1-c2)!==1)return;[a[i],a[z]]=[a[z],a[i]];re();}; const re=()=>{g.innerHTML="";a.forEach((v,i)=>{const bt=document.createElement("button");bt.className="cell-btn";bt.style.minHeight="74px";bt.style.background=v?"#17305a":"#0d1d37";bt.textContent=v||"";bt.onclick=()=>ck(i);g.appendChild(bt);});info.textContent=win()?"已复原":"点击相邻格移动";}; addControl("重开",()=>startGame("slide"),true); re(); return ()=>{}; }); }
function mountMathSprint(){ setMeta("45秒内尽量多答对"); return mountSimpleBoard((box,info)=>{const q=document.createElement("div");q.className="info";q.style.fontSize="1.25rem";const inp=document.createElement("input");inp.className="search";inp.placeholder="输入答案回车";box.append(q,inp); let a=0,b=0,ans=0,op="+",s=0,l=45; const nq=()=>{a=rand(2,30);b=rand(2,30);op=["+","-","*"][rand(0,2)];ans=op==="+"?a+b:op==="-"?a-b:a*b;q.textContent=`${a} ${op} ${b} = ?`;inp.value="";inp.focus();}; const tm=setInterval(()=>{l--;info.textContent=`分数 ${s} | ${l}s`;if(l<=0){clearInterval(tm);inp.disabled=true;q.textContent=`时间到 总分 ${s}`;}},1000); inp.onkeydown=e=>{if(e.key!=="Enter"||inp.disabled)return;if(Number(inp.value.trim())===ans)s+=10;else s=Math.max(0,s-3);nq();info.textContent=`分数 ${s} | ${l}s`;}; addControl("重开",()=>startGame("math"),true); info.textContent=`分数 0 | ${l}s`; nq(); return ()=>clearInterval(tm); }); }
function mountTypingRush(){ setMeta("限时打字"); return mountSimpleBoard((box,info)=>{const line=document.createElement("div");line.className="info";line.style.fontSize="1.1rem";const inp=document.createElement("input");inp.className="search";inp.placeholder="输入句子";box.append(line,inp); const arr=["speed makes skills stronger","practice builds confidence","tiny steps create big wins","focus and finish one thing","code play learn and repeat"]; let tar=arr[rand(0,arr.length-1)],l=40,d=0;line.textContent=tar; const tm=setInterval(()=>{l--;info.textContent=`完成 ${d} | ${l}s`;if(l<=0){clearInterval(tm);inp.disabled=true;line.textContent=`结束 完成 ${d} 句`;}},1000); inp.oninput=()=>{if(inp.value.trim()===tar){d++;tar=arr[rand(0,arr.length-1)];line.textContent=tar;inp.value="";info.textContent=`完成 ${d} | ${l}s`;}}; addControl("重开",()=>startGame("typing"),true); info.textContent=`完成 0 | ${l}s`; inp.focus(); return ()=>clearInterval(tm); }); }
function mountReaction(){ setMeta("看到绿色立刻点击"); return mountSimpleBoard((box,info)=>{const bt=document.createElement("button");bt.className="cell-btn";bt.style.minHeight="170px";bt.textContent="点击开始";box.appendChild(bt); let st=0,armed=false,t=null; const arm=()=>{armed=false;bt.style.background="#8a2338";bt.textContent="等待变绿";clearTimeout(t);t=setTimeout(()=>{armed=true;st=performance.now();bt.style.background="#2ccf87";bt.textContent="点我";},rand(1200,3400));}; bt.onclick=()=>{if(!armed){info.textContent="太快了";arm();return;}info.textContent=`反应 ${Math.round(performance.now()-st)} ms`;armed=false;bt.textContent="再来";}; addControl("开始",arm);addControl("重开",()=>startGame("reaction"),true); info.textContent="按开始后等待"; return ()=>clearTimeout(t); }); }
function mountRPS(){ setMeta("五局三胜"); return mountSimpleBoard((box,info)=>{const msg=document.createElement("div");msg.className="info";box.appendChild(msg); const t=["石头","剪刀","布"]; let p=0,a=0; const play=i=>{if(p>=3||a>=3)return;const c=rand(0,2);let m=`你:${t[i]} 电脑:${t[c]} `;if(i===c)m+="平";else if((i===0&&c===1)||(i===1&&c===2)||(i===2&&c===0)){p++;m+="你赢";}else{a++;m+="电脑赢";}info.textContent=`${p}:${a}`;msg.textContent=m;if(p>=3||a>=3)msg.textContent=p>a?"系列赛你赢了":"系列赛电脑赢了";}; addControl("石头",()=>play(0));addControl("剪刀",()=>play(1));addControl("布",()=>play(2));addControl("重开",()=>startGame("rps"),true); info.textContent="0:0";msg.textContent="请选择"; return ()=>{}; }); }
function mountGuess(){ setMeta("1-100猜数字"); return mountSimpleBoard((box,info)=>{const inp=document.createElement("input");inp.className="search";inp.type="number";inp.placeholder="输入1-100回车";box.appendChild(inp); const n=rand(1,100);let t=0; const sub=()=>{t++;const v=Number(inp.value);if(!v)return;info.textContent=v===n?`猜中了 ${n} 用了${t}次`:v<n?"小了":"大了";inp.value="";}; inp.onkeydown=e=>e.key==="Enter"&&sub(); addControl("提交",sub);addControl("重开",()=>startGame("guess"),true); info.textContent="开始猜吧"; return ()=>{}; }); }
function mountHangman(){ setMeta("猜字母完成单词"); return mountSimpleBoard((box,info)=>{const w=document.createElement("div");w.className="info";w.style.fontSize="1.4rem";const inp=document.createElement("input");inp.className="search";inp.maxLength=1;inp.placeholder="输入字母回车";box.append(w,inp); const ws=["forest","water","fire","galaxy","puzzle","adventure","offline","device"],tar=ws[rand(0,ws.length-1)],g=new Set();let miss=0; const dr=()=>{w.textContent=tar.split("").map(c=>g.has(c)?c:"_").join(" ");info.textContent=`错误 ${miss}/6`;if(tar.split("").every(c=>g.has(c)))info.textContent=`胜利 ${tar}`;if(miss>=6)info.textContent=`失败 答案 ${tar}`;}; inp.onkeydown=e=>{if(e.key!=="Enter"||miss>=6)return;const ch=inp.value.toLowerCase();inp.value="";if(!/^[a-z]$/.test(ch)||g.has(ch))return;g.add(ch);if(!tar.includes(ch))miss++;dr();}; addControl("重开",()=>startGame("hangman"),true); dr(); return ()=>{}; }); }

const gameDefs=[
{id:"fireice",title:"森林双灵闯关",desc:"双人配合过机关，红怕水蓝怕火",tags:["动作","双人","闯关"],stars:5,mount:mountFireIce},{id:"snake",title:"霓虹贪吃蛇",desc:"吃星核变长，别撞墙和自己",tags:["动作","经典"],stars:4,mount:mountSnake},{id:"runner",title:"极速跑酷",desc:"跳过障碍，速度会越来越快",tags:["动作","反应"],stars:4,mount:mountRunner},{id:"flappy",title:"天空穿梭",desc:"点击飞行穿越管道",tags:["动作","反应"],stars:4,mount:mountFlappy},{id:"pong",title:"光速乒乓",desc:"单人对战 AI，越打越快",tags:["竞技","经典"],stars:4,mount:mountPong},{id:"breakout",title:"星际打砖块",desc:"反弹球清空砖块",tags:["动作","经典"],stars:4,mount:mountBreakout},{id:"shooter",title:"银河射手",desc:"移动战机消灭敌群",tags:["动作","射击"],stars:4,mount:mountShooter},{id:"dodge",title:"陨石闪避",desc:"躲避从天而降的陨石",tags:["动作","生存"],stars:3,mount:mountDodge},
{id:"2048",title:"2048 进化",desc:"合并数字冲击更高分",tags:["益智","经典"],stars:5,mount:mount2048},{id:"ttt",title:"井字对决",desc:"与电脑或同桌快速对战",tags:["益智","双人"],stars:3,mount:mountTicTacToe},{id:"c4",title:"四子连线",desc:"横竖斜连 4 个即胜利",tags:["益智","双人"],stars:4,mount:mountConnect4},{id:"mine",title:"扫雷 8x8",desc:"避开地雷，标记危险格",tags:["益智","经典"],stars:4,mount:mountMinesweeper},{id:"memory",title:"记忆翻牌",desc:"最少步数配对全部卡片",tags:["益智","记忆"],stars:4,mount:mountMemory},{id:"simon",title:"节奏记忆",desc:"记住灯光顺序并复现",tags:["益智","记忆"],stars:3,mount:mountSimon},{id:"whack",title:"打地鼠",desc:"地鼠冒头就快速点击",tags:["休闲","反应"],stars:3,mount:mountWhack},{id:"flood",title:"色彩洪流",desc:"最少步数染满棋盘",tags:["益智","策略"],stars:4,mount:mountFlood},{id:"maze",title:"迷宫冲刺",desc:"找出出口，用时越少越好",tags:["益智","闯关"],stars:4,mount:mountMaze},{id:"slide",title:"数字华容道",desc:"滑动方块复原顺序",tags:["益智","经典"],stars:3,mount:mountSliding},{id:"math",title:"算术冲刺",desc:"45秒内尽可能多做题",tags:["学习","反应"],stars:3,mount:mountMathSprint},{id:"typing",title:"打字疾速",desc:"限时输入句子看速度",tags:["学习","反应"],stars:3,mount:mountTypingRush},{id:"reaction",title:"反应测试",desc:"看到绿色立刻点击",tags:["休闲","反应"],stars:3,mount:mountReaction},{id:"rps",title:"猜拳王",desc:"剪刀石头布五局对战",tags:["休闲","经典"],stars:3,mount:mountRPS},{id:"guess",title:"数字猜谜",desc:"在范围内猜中随机数",tags:["休闲","逻辑"],stars:3,mount:mountGuess},{id:"hangman",title:"单词救援",desc:"猜字母完成单词",tags:["学习","益智"],stars:3,mount:mountHangman}
];

const tagsOfGames=()=>["全部",...new Set(gameDefs.flatMap(g=>g.tags))];
function renderTags(){ tagRow.innerHTML=""; tagsOfGames().forEach(tag=>{const b=document.createElement("button"); b.className="tag-btn"+(tag===state.activeTag?" active":""); b.textContent=tag; b.onclick=()=>{state.activeTag=tag;renderTags();renderCatalog();}; tagRow.appendChild(b);}); }
function filteredGames(){ return gameDefs.filter(g=>{const byTag=state.activeTag==="全部"||g.tags.includes(state.activeTag); const q=state.query.trim().toLowerCase(); const byQ=!q||`${g.title} ${g.desc} ${g.tags.join(" ")}`.toLowerCase().includes(q); return byTag&&byQ;}); }
function renderCatalog(){ const list=filteredGames(); gameGrid.innerHTML=""; countBadge.textContent=`游戏 ${gameDefs.length} 个`; list.forEach(g=>{const c=document.createElement("button"); c.className="card"+(state.currentGame===g.id?" active":""); c.innerHTML=`<div class=\"card-title\"><h3>${g.title}</h3><span class=\"stars\">${"★".repeat(g.stars)}${"☆".repeat(5-g.stars)}</span></div><p>${g.desc}</p><div class=\"chips\">${g.tags.map(t=>`<span class=\"chip\">${t}</span>`).join("")}</div>`; c.onclick=()=>startGame(g.id); gameGrid.appendChild(c);}); if(!list.length){const d=document.createElement("div"); d.className="info"; d.textContent="没有匹配结果"; gameGrid.appendChild(d);} if(!state.currentGame&&list.length)startGame(list[0].id); }
function startGame(id){ const g=gameDefs.find(i=>i.id===id); if(!g)return; clearGame(); state.currentGame=id; activeTitle.textContent=g.title; activeDesc.textContent=g.desc; state.cleanup=g.mount(); renderCatalog(); }

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
searchInput.addEventListener("input",()=>{ state.query=searchInput.value; renderCatalog(); });
setupNetworkAwareMode(); renderTags(); renderCatalog();
