/* A taut, massless, inextensible rope; frictionless pulleys; quasi-static motion. */
(function(root){
  const setups={fixed:{name:'定滑轮',n:1,down:true,moving:false},moving:{name:'动滑轮',n:2,down:false,moving:true},double:{name:'滑轮组 · 2 段',n:2,down:true,moving:true},triple:{name:'滑轮组 · 3 段',n:3,down:false,moving:true}};
  function measure(mode,G,Gp,s){const c=setups[mode];const load=G+(c.moving?Gp:0);return {n:c.n,F:load/c.n,h:s/c.n,s,G,Gp:c.moving?Gp:0,input:load*s/c.n,output:G*s/c.n,ratio:G/(load/c.n)};}
  setups.quad={name:'滑轮组 · 4 段',n:4,down:true,moving:true};
  // A single rope alternates between the fixed and moving blocks.
  for(let f=0;f<=2;f++)for(let m=0;m<=2;m++)for(const start of ['top','bottom']){
    const valid=start==='top'?m>=1&&(f===m||f===m-1):f>=1&&(f===m||f===m+1);
    if(!valid)continue;
    const n=m===0?1:2*m+(start==='bottom'?1:0);
    setups['rig-'+f+'-'+m+'-'+start]={name:f+'定＋'+m+'动 · '+(start==='top'?'上方固定绳端':'移动端固定绳端'),n,down:start==='top'?f===m:f===m+1,moving:m>0,fixedCount:f,movingCount:m,start};
  }
  const stiffness=100;
  function pull(mode,G,Gp,q){
    const required=measure(mode,G,Gp,0).F;
    const extension=Math.min(Math.max(q,0),required/stiffness);
    const s=Math.max(0,q-required/stiffness);
    const d=measure(mode,G,Gp,s);
    return {...d,F:extension*stiffness,required,extension,q:Math.max(0,q),support:Math.max(0,G+d.Gp-d.n*extension*stiffness)};
  }
  root.PulleyPhysics={setups,measure,pull,stiffness};
  if(typeof module!=='undefined')module.exports=root.PulleyPhysics;
})(typeof window!=='undefined'?window:globalThis);
