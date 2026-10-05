const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const rows=require('./planner-control-families.json');
const mode=process.argv[2],url=process.argv[3];
async function check(p,row){
 const drawer=p.locator('#seed-arrangement');
 assert.equal(await drawer.locator('summary').count(),1);
 assert.equal(await drawer.locator('summary').textContent(),'Reorder and pack');
 assert(await drawer.evaluate(e=>!e.open));
 for(const c of row.controls)assert(await p.locator('#'+c.id).isDisabled());
 await p.locator('#preset-wide-fan').click();await p.locator('#reverse-drawing').click();
 const snapshot=()=>p.evaluate(()=>{const f=__sunflower;return [f.heldInDrawnOrder(),f.undoDepth(),f.redoDepth(),f.root(),f.register(),f.tempo(),f.soundEnabled(),f.rememberedDrawing()]}),before=await snapshot();
 await drawer.locator('summary').click();
 const group=p.locator('#family-'+row.id);
 assert.equal(await group.count(),1);assert.equal(await group.evaluate(e=>e.tagName),'FIELDSET');
 assert(await group.evaluate(e=>!!e.closest('#seed-arrangement .seed-arrangement-buttons')));
 assert.equal(await group.locator(':scope > legend').textContent(),row.legend);
 assert.deepEqual(await group.locator('button').evaluateAll(es=>es.map(e=>e.id)),row.controls.map(c=>c.id));
 assert.equal(await group.locator('details,summary').count(),0);
 let enabled=null;
 for(const c of row.controls){const btn=p.locator('#'+c.id);assert.equal(await btn.count(),1);assert.equal(await btn.textContent(),c.label);await btn.scrollIntoViewIfNeeded();const box=await btn.boundingBox();assert(box.height>=43.9);assert(box.width>0);assert(await btn.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}));if(!enabled&&await btn.isEnabled())enabled=btn;}
 assert.deepEqual(await snapshot(),before);assert(enabled,'at least one edit changes the reference drawing');
 await enabled.click();assert.notDeepEqual((await snapshot())[0],before[0]);await p.locator('#undo-drawing').click();assert.deepEqual((await snapshot())[0],before[0]);
 const afterUndo=await snapshot();await drawer.locator('summary').click();assert.deepEqual(await snapshot(),afterUndo);assert(await group.evaluate(e=>!e.checkVisibility()));await drawer.locator('summary').click();assert.deepEqual(await snapshot(),afterUndo);
 assert.equal(await p.locator('#phrase-guide').locator('summary').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
}
async function main(){assert.equal(rows.length,4);const ids=rows.flatMap(r=>r.controls.map(c=>c.id));assert.equal(ids.length,35);assert.equal(new Set(ids).size,35);if(mode==='facts'){console.log('four arranger families name 35 unique controls');return;}const row=rows.find(r=>r.id===mode);assert(row);const b=await chromium.launch();try{for(const width of [390,1280]){const p=await b.newPage({viewport:{width,height:900}});assert.equal((await p.goto(url)).status(),200);await check(p,row);await p.close();}console.log(mode+' groups playable phrase edits without changing the drawing');}finally{await b.close();}}
module.exports={check,rows};if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
