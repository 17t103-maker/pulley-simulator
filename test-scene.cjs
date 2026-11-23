const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:id==='fixed-count'||id==='moving-count'?2:id==='rope-start'?'bottom':0,options:id==='rope-start'?[{value:'top'},{value:'bottom'}]:[],addEventListener(){},classList:{toggle(){}},focus(){}});return nodes.get(id);};
const ctx=vm.createContext({PulleyPhysics:require('./physics.js'),document:{getElementById:node,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:()=>null},requestAnimationFrame(){},console});
vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
function rope(){const svg=node('scene').innerHTML;return svg.match(/<path d="([^"]+)" fill="none" stroke="#9d6c2f"/)[1];}
// Arc sizes and sweeps stay fixed; only vertical spans can change rope length.
function straightLength(d){const t=d.match(/[MVA]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g);let i=0,y=0,total=0;while(i<t.length){const op=t[i++];if(op==='M'){i++;y=+t[i++];}else if(op==='V'){const next=+t[i++];total+=Math.abs(next-y);y=next;}else if(op==='A'){i+=6;y=+t[i++];}else throw Error(op);}return total;}
let cases=0;
for(const mode of Object.keys(ctx.PulleyPhysics.setups))for(const G of [2,10,30])for(const Gp of [0,2,6]){
 vm.runInContext(`Object.assign(state,{mode:'${mode}',G:${G},Gp:${Gp},mass:true});reset();`,ctx);
 const initial=straightLength(rope()),arcs=rope().match(/A[^V]+/g);
 for(const h of [.1,.2,.4]){
  vm.runInContext(`setPull(pullAtHeight(${h}))`,ctx);
  assert.ok(Math.abs(straightLength(rope())-initial)<1e-7,mode+' rope length');
  assert.equal(rope().match(/A/g).length,arcs.length);
  assert.ok(Math.abs(parseFloat(node('height').innerHTML)-h)<1e-7);
  const handle=node('scene').innerHTML.match(/<rect x="[^"]+" y="([^"]+)" width="66"/);
  assert.ok(+handle[1]>=0 && +handle[1]+17<=600,mode+' handle bounds');
  cases++;
 }
 vm.runInContext('runToHeight(.2);for(let i=1;i<=2000 && state.running;i++)tick(last+50);',ctx);
 assert.equal(vm.runInContext('state.running',ctx),false);
 assert.ok(Math.abs(vm.runInContext('data().h',ctx)-.2)<1e-10,mode+' comparison stop');
 vm.runInContext('reset()',ctx);
 assert.equal(node('force').textContent,'0.00');
}
console.log(`PASS: ${cases} rendered geometry cases and 45 exact-height animation stops.`);
