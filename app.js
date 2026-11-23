const $=id=>document.getElementById(id);
const {setups,measure,pull,stiffness}=PulleyPhysics;
const state={mode:'rig-2-2-bottom',q:0,s:0,G:10,Gp:2,mass:false,running:false,targetH:.4,segments:true,arrows:true};
let records=[];try{const saved=JSON.parse(localStorage.getItem('pulley-lab-records-v1')||'[]');if(Array.isArray(saved))records=saved.filter(r=>setups[r.mode]&&['G','Gp','F','h','s','n'].every(k=>Number.isFinite(r[k]))).slice(-100);}catch{}
const scale=90,maxH=.4;
const data=()=>pull(state.mode,state.G,state.mass?state.Gp:0,state.q);
const pullAtHeight=h=>measure(state.mode,state.G,state.mass?state.Gp:0,0).F/stiffness+setups[state.mode].n*h;
const maxPull=()=>pullAtHeight(maxH);
const txt=(x,y,t,fill='#526e78',size=14,anchor='start')=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="${anchor}">${t}</text>`;
const line=(x1,y1,x2,y2,color='#7f9198',width=3,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const arrow=(x,y,end,color,label)=>line(x,y,x,end,color,3,`marker-end="url(#${color==='#16857d'?'green':'orange'})"`)+txt(x+12,(y+end)/2+5,label,color,14);
function wheel(x,y,angle){return `<g filter="url(#shadow)"><circle cx="${x}" cy="${y}" r="32" fill="#324e5a" stroke="#9daeb6" stroke-width="3"/><circle cx="${x}" cy="${y}" r="26" fill="url(#wheel)" stroke="#c7d4d9" stroke-width="2"/><g transform="rotate(${angle},${x},${y})">${[0,60,120].map(a=>`<g transform="rotate(${a},${x},${y})">${line(x-23,y,x+23,y,'#375360',6)}</g>`).join('')}</g><circle cx="${x}" cy="${y}" r="10" fill="url(#metal)" stroke="#304954" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="#536d78"/></g>`;}
function draw(){
 const d=data(),c=setups[state.mode],dy=d.h*scale,y=350-dy,a=dy/32*180/Math.PI;
 let rope='',hardware='',segments=[],loadX=298,loadY=430-dy,freeX=362,freeY=240+state.s*scale;
 const fixedMount=(x)=>line(x,70,x,140,'#687e86',8)+`<rect x="${x-13}" y="76" width="26" height="12" rx="4" fill="url(#metal)"/>`;
 const anchor=(x,yy)=>`<circle cx="${x}" cy="${yy}" r="6" fill="#d6e0e3" stroke="#536c77" stroke-width="3"/>`;
 if(state.mode==='fixed'){
  hardware=fixedMount(330)+wheel(330,140,a);rope=`M298 ${loadY} V140 A32 32 0 0 1 362 140 V${freeY}`;segments=[[298,245,1]];
 }else if(state.mode==='moving'){
  loadX=330;freeX=362;freeY=300-state.s*scale;
  hardware=anchor(298,78)+wheel(330,y,-a)+line(330,y,330,loadY,'#657c86',6);
  rope=`M298 78 V${y} A32 32 0 0 0 362 ${y} V${freeY}`;segments=[[298,220,1],[362,(freeY+y)/2,2]];
 }else if(state.mode==='double'){
  loadX=298;freeX=394;freeY=220+state.s*scale;
  hardware=anchor(266,78)+fixedMount(362)+wheel(298,y,-a)+wheel(362,140,2*a)+line(298,y,298,loadY,'#657c86',6);
  rope=`M266 78 V${y} A32 32 0 0 0 330 ${y} V140 A32 32 0 0 1 394 140 V${freeY}`;segments=[[266,230,1],[330,230,2]];
 }else if(state.mode==='triple'){
  loadX=362;freeX=394;freeY=345-state.s*scale;
  hardware=fixedMount(298)+wheel(298,140,a)+wheel(362,y,-2*a)+line(266,y+44,362,y+44,'#657c86',7)+line(362,y,362,loadY,'#657c86',6)+anchor(266,y+44);
  rope=`M266 ${y+44} V140 A32 32 0 0 1 330 140 V${y} A32 32 0 0 0 394 ${y} V${freeY}`;segments=[[266,235,1],[330,235,2],[freeY>y-45?420:394,(freeY+y)/2,3]];
 }else{
  const cfg=c.fixedCount!==undefined?c:{fixedCount:2,movingCount:2,start:'top'};
  const total=cfg.fixedCount+cfg.movingCount, startX=350-total*32;
  const bottom=380-dy, top=140, beginsTop=cfg.start==='top';
  freeX=startX+total*64;freeY=c.down?190+state.s*scale:350-state.s*scale;
  loadX=startX+(c.n-1)*32;
  const fixed=[],moving=[];
  for(let i=0;i<total;i++){
    const isMoving=beginsTop?i%2===0:i%2===1;
    const x=startX+32+i*64, yy=isMoving?bottom:top;
    (isMoving?moving:fixed).push([x,yy,i]);
  }
  // Rigid bars join the axles, behind the rope and full circular sheaves.
  if(fixed.length){hardware+=line(fixed[0][0],top,fixed.at(-1)[0],top,'#657c86',7);for(const [x] of fixed)hardware+=fixedMount(x);}
  if(moving.length){const left=beginsTop?moving[0][0]:startX,right=moving.at(-1)[0];
    hardware+=line(left,bottom+43,right,bottom+43,'#657c86',7)+line(loadX,bottom+43,loadX,loadY,'#657c86',6);
    for(const [x] of moving)hardware+=line(x,bottom,x,bottom+43,'#657c86',6);
  }
  const anchorY=beginsTop?78:(moving.length?bottom+43:loadY);
  hardware+=anchor(startX,anchorY);
  rope='M'+startX+' '+anchorY;
  for(let i=0;i<total;i++){
    const isMoving=beginsTop?i%2===0:i%2===1, x=startX+32+i*64, yy=isMoving?bottom:top;
    hardware+=wheel(x,yy,(isMoving?-1:1)*(i+1)*a);
    rope+=' V'+yy+' A32 32 0 0 '+(isMoving?0:1)+' '+(x+32)+' '+yy;
  }
  rope+=' V'+freeY;
  for(let i=0;i<c.n;i++)segments.push([startX+i*64,i===c.n-1&&!c.down?(freeY+bottom)/2:245+(i%2)*28,i+1]);
  hardware+=txt(startX-8,anchorY+(beginsTop?20:18),'绳端固定点','#8a6028',12,'end');
 }

 const sign=c.down?1:-1,extension=d.extension*scale,handleY=freeY+sign*(76+extension);
 let rulers='';for(let i=0;i<=8;i++){let yy=490-i*scale/10;rulers+=line(172,yy,i%2?180:186,yy,'#a4b4b9',1)+(i%2===0?txt(162,yy+4,(i/10).toFixed(1),'#879a9f',11,'end'):'');}
 const reading=d.F.toFixed(2);const springLen=14+extension;
 const spring=`<g transform="translate(${freeX},${freeY}) scale(1,${sign})">${line(0,0,0,9,'#587580',3)}<rect x="-19" y="9" width="38" height="${51+extension}" rx="8" fill="url(#meter)" stroke="#adbbc0" stroke-width="2"/><path d="M0 13 ${Array.from({length:8},(_,i)=>`L${i%2?7:-7} ${16+i*springLen/8}`).join(' ')} L0 ${16+springLen}" fill="none" stroke="#7e8c93" stroke-width="2"/>${line(-13,16+springLen,13,16+springLen,'#c77827',2)}${line(0,60+extension,0,70+extension,'#587580',3)}</g>`;
 const svg=`<defs><linearGradient id="metal"><stop stop-color="#788e96"/><stop offset=".28" stop-color="#dce5e9"/><stop offset=".55" stop-color="#9fb0b8"/><stop offset="1" stop-color="#647d87"/></linearGradient><radialGradient id="wheel" cx="35%" cy="25%"><stop stop-color="#b7cbd1"/><stop offset=".6" stop-color="#7897a6"/><stop offset="1" stop-color="#466473"/></radialGradient><linearGradient id="load"><stop stop-color="#345260"/><stop offset=".45" stop-color="#5f7f8a"/><stop offset="1" stop-color="#2f4c59"/></linearGradient><linearGradient id="meter"><stop stop-color="#cbd9dc"/><stop offset=".4" stop-color="#fff"/><stop offset="1" stop-color="#dbe5e7"/></linearGradient><linearGradient id="wall" x2="0" y2="1"><stop stop-color="#edf3f4"/><stop offset="1" stop-color="#e0e9ec"/></linearGradient><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#bcced4" stroke-opacity=".24"/></pattern><filter id="shadow" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#284854" flood-opacity=".2"/></filter><marker id="green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#16857d"/></marker><marker id="orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#cb8030"/></marker></defs>
 <rect width="800" height="600" fill="url(#wall)"/><rect width="800" height="530" fill="url(#grid)"/><path d="M0 530H800V600H0Z" fill="#d0dddf"/><path d="M0 530H800" stroke="#c0d1d6" stroke-width="3"/>
 <ellipse cx="358" cy="551" rx="219" ry="14" fill="#a5b8bd" opacity=".3"/><g filter="url(#shadow)"><rect x="214" y="58" width="13" height="481" rx="4" fill="url(#metal)"/><rect x="515" y="58" width="13" height="481" rx="4" fill="url(#metal)"/><rect x="200" y="53" width="340" height="23" rx="5" fill="url(#metal)"/><rect x="195" y="536" width="54" height="12" rx="4" fill="#607a84"/><rect x="495" y="536" width="54" height="12" rx="4" fill="#607a84"/></g>
 <rect x="145" y="354" width="46" height="149" rx="5" fill="#f7fafb" stroke="#c9d8dd"/>${rulers}${d.h>0?line(180,490-dy,loadX-34,490-dy,'#16857d',1.5,'stroke-dasharray="4 3"')+`<path d="M180 ${490-dy}l9 -5v10Z" fill="#16857d"/>`:''}${txt(168,343,'m','#82979d',12,'middle')}
 <rect x="${loadX-46}" y="490" width="92" height="13" rx="3" fill="url(#metal)"/><path d="M${loadX-37} 503V530 M${loadX+37} 503V530" stroke="#647d87" stroke-width="7"/>${line(190,490,loadX+50,490,'#92aab1',1,'stroke-dasharray="5 5"')}${hardware}
 <path d="${rope}" fill="none" stroke="#9d6c2f" stroke-width="6" stroke-linejoin="round"/><path d="${rope}" fill="none" stroke="#e7b65e" stroke-width="3" stroke-dasharray="3 3"/>
 <g filter="url(#shadow)"><path d="M${loadX} ${loadY}v8 q15 5 0 12 q-10 0 -8 -9" fill="none" stroke="#4c6772" stroke-width="4"/><rect x="${loadX-32}" y="${loadY+20}" width="64" height="40" rx="6" fill="url(#load)"/><path d="M${loadX-27} ${loadY+25}h54" stroke="#9fb5bd" stroke-opacity=".5"/><rect x="${loadX-24}" y="${loadY+31}" width="48" height="20" rx="4" fill="#eef3f3"/>${txt(loadX,loadY+46,state.G+' N','#344e59',14,'middle')}</g>
 ${spring}<g id="handle" tabindex="0" role="slider" aria-label="拖动手柄，拉动绳端" aria-valuemin="0" aria-valuemax="${maxPull()}" aria-valuenow="${state.q.toFixed(3)}"><rect x="${freeX-33}" y="${handleY-8}" width="66" height="17" rx="8" fill="#dd983e" stroke="#af6e23" stroke-width="2"/>${[0,1,2,3,4].map(i=>line(freeX-18+i*9,handleY-4,freeX-18+i*9,handleY+5,'#f5c57f',2)).join('')}<rect x="${freeX-45}" y="${handleY-18}" width="90" height="37" fill="transparent"/></g>
 <g><rect x="${freeX+33}" y="${freeY+sign*33-14}" width="91" height="28" rx="6" fill="#fff" stroke="#d3e0e2"/>${txt(freeX+78,freeY+sign*33+5,reading+' N','#b6752a',16,'middle')}</g>
 ${state.segments?segments.map(([x,yy,n])=>`<circle cx="${x}" cy="${yy}" r="12" fill="#137c73" stroke="white" stroke-width="2"/>${txt(x,yy+5,n,'white',13,'middle')}`).join(''):''}
 ${state.arrows?(d.h>0?arrow(loadX-54,loadY+50,loadY-5,'#16857d','h'):'')+(d.F>.001?arrow(freeX+135,handleY-sign*40,handleY-sign*40+sign*d.F*6,'#cb8030','F'):''):''}
 <g transform="translate(570 95)"><rect width="194" height="119" rx="10" fill="#ffffffc9" stroke="#d3e0e3"/>${txt(16,28,'观察装置','#607e87',13)}${txt(16,56,c.moving?'动滑轮随重物上升':'轮轴固定在支架上','#2e5360',15)}${txt(16,82,c.down?'拉绳向下 · 重物向上':'拉绳向上 · 重物向上','#6e858d',12)}${txt(16,103,'侧面展开 · 最大提升 0.40 m','#869ba1',12)}</g>
 ${txt(575,395,'支承台支持力 = '+d.support.toFixed(2)+' N','#5e7a84',14)}${txt(575,420,'提升所需 F = '+d.required.toFixed(2)+' N','#b6752a',14)}${txt(575,445,'物重 G = '+state.G+' N','#5e7a84',14)}${txt(575,470,'移动组总重 G动 = '+d.Gp+' N','#5e7a84',14)}${txt(575,495,'h = '+d.h.toFixed(3)+' m','#16857d',17)}
 ${txt(350,577,'先拉伸测力计，达到提升拉力后重物才离开支承台','#6b858d',12,'middle')}`;
 $('scene').innerHTML=svg;
}
function update(){
 const d=data(),c=setups[state.mode];state.s=d.s;
 $('scene-title').textContent=c.name;$('force').textContent=d.F.toFixed(2);
 $('required').textContent=d.required.toFixed(2)+' N';$('force-progress').value=d.F/d.required;
 $('height').innerHTML=d.h.toFixed(3)+' <small>m</small>';$('distance').innerHTML=d.s.toFixed(3)+' <small>m</small>';$('count').innerHTML=d.n+' <small>段</small>';$('advantage').innerHTML=d.ratio.toFixed(2)+' <small>倍</small>';
 $('travel').max=maxPull();$('travel').value=state.q;$('travel-out').textContent=state.q.toFixed(3)+' m';
 $('weight-out').textContent=state.G+' N';$('pulley-out').textContent=state.Gp+' N';$('mass-settings').hidden=!state.mass||!c.moving;
 $('model-tag').textContent=state.mass&&c.moving?'计入移动组总重':'理想模型';$('model-note').textContent=state.mass&&c.moving?'计入整个移动滑轮组的总重；忽略绳重与摩擦。':'忽略绳重、滑轮自重及摩擦，绳不可伸长。';
 $('mass').disabled=!c.moving;$('mass').checked=state.mass&&c.moving;
 $('play').textContent=state.running?'Ⅱ 暂停并握住':'▶ 演示拉绳';
 $('motion-status').textContent=d.F<.001?'尚未施力 · 重物由支承台托住':d.F<d.required-1e-7?'正在施力 · 重物尚未离台':d.h<.00001?'刚好达到提升拉力':state.q>=maxPull()-1e-6?'已到达提升上限':state.running?'拉力保持 · 正在匀速提升':Math.abs(d.h-.2)<1e-7?'已到对比高度 0.20 m · 握住手柄':'握住手柄 · 保持平衡';
 $('pull-hint').textContent=d.F<d.required-1e-7?(c.down?'向下':'向上')+'拖动橙色手柄，逐渐增加拉力':'继续拖动提升重物；反向拖动可缓慢放回';draw();
}
function setPull(q){state.q=Math.max(0,Math.min(maxPull(),q));update();}
function reset(){state.running=false;state.q=0;state.s=0;update();}
function inquiry(){const c=setups[state.mode],gp=state.mass&&c.moving; $('question').textContent=`把 ${state.G} N 的重物提升 0.20 m${gp?'（移动滑轮组总重 '+state.Gp+' N）':''}，绳端需要移动多远？`;$('answers').innerHTML=[.2,.4,.6,.8,1].map(v=>`<button data-answer="${v}">${v.toFixed(2)} m</button>`).join('');$('answer-feedback').textContent='选择你的预测，再动手测量。';$('principle').open=false;
 $('explanation').innerHTML=`<div class="formula">F = ${gp?'(G + G动)':'G'} / ${c.n}；s = ${c.n}h</div><p>${c.fixedCount!==undefined?('使用 '+c.fixedCount+' 个定滑轮与 '+c.movingCount+' 个动滑轮。'+(c.start==='bottom'?'绳端固定在移动部分，这一股也参与承重。':'绳端固定在上方支架。')+'承重绳共 '+c.n+' 股；'+(c.down?'向下':'向上')+'拉动自由端。'):state.mode==='fixed'?'定滑轮的轴固定，可改变拉力方向；理想情况下不省力，也不省距离。':state.mode==='moving'?'动滑轮和重物一起上升，由两段竖直绳共同承担重量。理想情况下省一半力，但绳端要移动两倍距离；这个绕法需要向上拉。':state.mode==='double'?'两段绳支承动滑轮，定滑轮用来改变拉力方向。理想情况下 F = G/2，向下拉绳，重物向上升。':state.mode==='quad'?'两个定滑轮固定在同一组支架上，两个动滑轮连接成一个整体。四段绳共同承重，理想情况下 F = G/4，绳端移动距离是提升高度的四倍。图为侧面展开示意。':'绳的一端固定在随重物移动的支架上，这一段也参与承重。三段绳共同承重，理想情况下 F = G/3；此绕法需要向上拉。滑轮组是否改变拉力方向，取决于绕法。'}</p><p>${gp?'增加的拉力用于提升动滑轮；Fs = (G + G动)h。只把提升重物视为有用功时，η = G / (G + G动)。':'理想情况下 Fs = Gh。省力不省功，省多少倍的力，就要多拉多少倍的距离。'}</p><p class="muted">未提起时，支承台支持力 N = G + G动 − nF；达到提升拉力后，继续缓慢拉动，拉力近似保持不变。手柄行程还包含测力计的弹性伸长，s 只计绳端移动量。承重绳段数取决于支承整个移动部分的绳段，不是滑轮个数；实际器材还会受到摩擦影响。</p>`;}
function save(){try{localStorage.setItem('pulley-lab-records-v1',JSON.stringify(records));}catch{$('record-status').textContent='浏览器无法保存数据，请导出 CSV 留存。';}}
function renderRecords(){$('record-count').textContent=records.length+' 组';$('records').innerHTML=records.length?records.map(r=>`<tr><td>${setups[r.mode].name}<br><small>${r.Gp?'计入自重':'理想模型'}</small></td><td>${r.G}</td><td>${r.Gp}</td><td>${r.F.toFixed(2)}</td><td>${r.h.toFixed(3)}</td><td>${r.s.toFixed(3)}</td><td>${(r.s/r.h).toFixed(2)}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">还没有实验数据<br><small>让同一个重物上升相同高度，比较不同绕法。</small></td></tr>';$('export').disabled=!records.length;$('clear').disabled=!records.length;}
function configure(changed){
 let f=+$('fixed-count').value,m=+$('moving-count').value,start=$('rope-start').value;
 const valid=(ff,mm)=>Object.values(setups).some(c=>c.fixedCount===ff&&c.movingCount===mm);
 let adjusted=false;
 if(!valid(f,m)){adjusted=true;if(changed==='moving')f=[0,1,2].filter(v=>valid(v,m)).sort((a,b)=>Math.abs(a-f)-Math.abs(b-f))[0];else m=[0,1,2].filter(v=>valid(f,v)).sort((a,b)=>Math.abs(a-m)-Math.abs(b-m))[0];}
 if(!setups['rig-'+f+'-'+m+'-'+start]){start=start==='top'?'bottom':'top';adjusted=true;}
 state.mode='rig-'+f+'-'+m+'-'+start;
 $('fixed-count').value=f;$('moving-count').value=m;$('rope-start').value=start;
 for(const opt of $('rope-start').options)opt.disabled=!setups['rig-'+f+'-'+m+'-'+opt.value];
 const c=setups[state.mode];
 $('rig-summary').textContent='自动得出：'+c.n+' 股承重绳 · 向'+(c.down?'下':'上')+'拉';
 $('rig-note').textContent=adjusted?'已配合数量调整可行绕法。单绳依次交替绕过定、动滑轮，数量需匹配。':'选择绳端固定位置，沿金色绳子观察绕绳顺序；股数由装置自动计算。';
 reset();inquiry();
}
$('fixed-count').onchange=()=>configure('fixed');$('moving-count').onchange=()=>configure('moving');$('rope-start').onchange=()=>configure('rope');
$('weight').oninput=e=>{state.G=+e.target.value;reset();inquiry();};$('pulley-weight').oninput=e=>{state.Gp=+e.target.value;reset();inquiry();};$('mass').onchange=e=>{state.mass=e.target.checked;reset();inquiry();};['segments','arrows'].forEach(k=>$(k).onchange=e=>{state[k]=e.target.checked;update();});
$('travel').oninput=e=>{state.running=false;setPull(+e.target.value);};$('reset').onclick=reset;
function runToHeight(h){state.targetH=h;if(state.q>=pullAtHeight(h)-1e-9){state.q=0;state.s=0;}state.running=true;update();}
$('play').onclick=()=>{if(state.running){state.running=false;update();}else runToHeight(maxH);};
$('compare-height').onclick=()=>runToHeight(.2);
let last=0;function tick(time){const dt=Math.min((time-last)/1000,.05);last=time;if(state.running){const d=data(),speed=d.F<d.required-1e-7?d.required/stiffness/2.2:.085;const target=pullAtHeight(state.targetH);setPull(Math.min(target,state.q+speed*dt));if(state.q>=target){state.running=false;update();}}requestAnimationFrame(tick);}requestAnimationFrame(tick);
let drag=null;const pointY=e=>{const pt=new DOMPoint(e.clientX,e.clientY);return pt.matrixTransform($('scene').getScreenCTM().inverse()).y;};
$('scene').addEventListener('pointerdown',e=>{if(!e.target.closest('#handle'))return;state.running=false;drag={id:e.pointerId,y:pointY(e),q:state.q};$('scene').setPointerCapture(e.pointerId);e.preventDefault();});
$('scene').addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId)setPull(drag.q+(pointY(e)-drag.y)/scale*(setups[state.mode].down?1:-1));});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>$('scene').addEventListener(ev,()=>drag=null));
$('scene').addEventListener('keydown',e=>{if(e.target.id!=='handle')return;const down=setups[state.mode].down;let ds=e.key==='ArrowDown'?(down?.01:-.01):e.key==='ArrowUp'?(down?-.01:.01):0;if(ds){e.preventDefault();state.running=false;setPull(state.q+ds);$('handle').focus();}});
$('answers').onclick=e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('#answers button').forEach(x=>x.classList.toggle('selected',x===b));const correct=Math.abs(+b.dataset.answer-setups[state.mode].n*.2)<1e-6;$('answer-feedback').textContent=correct?'预测正确！现在把重物提升到 0.20 m，看看读数是否一致。':'再想一想：有几段绳子随重物上升而缩短？可以先动手测量。';};
$('record').onclick=()=>{state.running=false;update();if(state.s<.001){$('record-status').textContent='请先拉动绳子，让重物上升后再记录。';return;}records.push({...data(),mode:state.mode});if(records.length>100)records.shift();$('record-status').textContent='已记录。换一种装置，保持物重和提升高度相同再比较。';save();renderRecords();};
$('clear').onclick=()=>{if(confirm('清空本机保存的全部实验记录？')){records=[];save();renderRecords();$('record-status').textContent='记录已清空。';}};
$('export').onclick=()=>{const rows=[['装置','模型','物重G(N)','动滑轮重G动(N)','承重段数n','拉力F(N)','上升高度h(m)','拉绳距离s(m)','s/h','输入功(J)','有用功(J)'],...records.map(r=>[setups[r.mode].name,r.Gp?'计入自重':'理想模型',r.G,r.Gp,r.n,r.F.toFixed(4),r.h.toFixed(4),r.s.toFixed(4),(r.s/r.h).toFixed(2),r.input.toFixed(4),r.output.toFixed(4)])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='滑轮实验记录.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('help').onclick=()=>$('help-dialog').showModal();$('close-help').onclick=()=>$('help-dialog').close();$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('record-status').textContent='当前窗口不支持全屏，可以用浏览器打开后按 F11。';}};
document.addEventListener('fullscreenchange',()=>$('fullscreen').textContent=document.fullscreenElement?'退出全屏':'全屏实验');
configure();renderRecords();
