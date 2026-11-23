const assert=require('node:assert/strict');
const {measure,setups,pull,stiffness}=require('./physics.js');
for(const [mode,c] of Object.entries(setups))for(const G of [2,10,30])for(const Gp of [0,2,6])for(const h of [.01,.2,.4]){
 const d=measure(mode,G,Gp,c.n*h);
 assert.ok(Math.abs(d.h-h)<1e-10);
 assert.ok(Math.abs(d.F*c.n-G-(c.moving?Gp:0))<1e-10);
 assert.ok(Math.abs(d.F*d.s-d.input)<1e-10);
 assert.ok(Math.abs(d.output-G*h)<1e-10);
 assert.ok(d.input>=d.output-1e-10);
}
assert.equal(measure('fixed',10,6,.2).F,10);
assert.equal(measure('moving',10,0,.4).F,5);
assert.equal(measure('double',10,2,.4).F,6);
assert.equal(measure('triple',12,0,.6).F,4);
for(const mode of Object.keys(setups))for(const G of [2,10,30])for(const Gp of [0,2,6]){
 const required=measure(mode,G,Gp,0).F,extension=required/stiffness;
 const rest=pull(mode,G,Gp,0),half=pull(mode,G,Gp,extension/2),lift=pull(mode,G,Gp,extension+.2*setups[mode].n),higher=pull(mode,G,Gp,extension+.4*setups[mode].n);
 assert.equal(rest.F,0);assert.equal(rest.h,0);
 assert.ok(Math.abs(half.F-required/2)<1e-10);assert.equal(half.h,0);
 assert.ok(Math.abs(half.support-(G+half.Gp)/2)<1e-10);
 assert.ok(Math.abs(lift.h-.2)<1e-10);assert.ok(Math.abs(lift.F-required)<1e-10);
 assert.ok(Math.abs(higher.F-lift.F)<1e-10);assert.ok(Math.abs(lift.support)<1e-10);
}
console.log('PASS: 135 equilibrium cases and 45 loading sequences (zero force, support reaction, lift threshold, constant lifting force).');

