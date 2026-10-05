const assert=require('node:assert/strict');
const fixture=require('./planner-arranger-guide.json');
function facts(){assert.equal(fixture.families.length,4);const all=fixture.families.flatMap(f=>f.helpers);assert.equal(all.length,35);assert.equal(new Set(all.map(h=>h.class)).size,35);assert.equal(fixture.unchanged.length,24);console.log('four guide families preserve 35 arranger explanations and 24 other helpers');}
async function check(page){
 const result=await page.evaluate(f=>{
  const guide=document.querySelector('#phrase-guide');
  const errors=[];const demand=(ok,msg)=>{if(!ok)errors.push(msg)};
  demand(guide.querySelectorAll('summary').length===1,'one summary');
  demand(!guide.querySelector('details'),'no nested details');
  demand(guide.querySelector('summary').textContent==='How the phrase controls work','summary text');
  demand(!document.querySelector('#seed-arrangement').contains(guide),'sibling guide');
  demand(JSON.stringify([...guide.querySelectorAll(':scope > section')].map(e=>e.id))===JSON.stringify(f.families.map(g=>g.id)),'section order');
  for(const row of f.families){
   const section=document.getElementById(row.id);demand(section?.parentElement===guide,row.id+' direct section');if(!section)continue;
   demand(section.querySelector(':scope > h3')?.textContent===row.heading,row.id+' heading');
   demand(section.getAttribute('aria-labelledby')===row.id+'-heading',row.id+' labelledby');
   demand(section.querySelector('h3')?.id===row.id+'-heading',row.id+' heading id');
   demand(JSON.stringify([...section.children].slice(1).map(e=>e.className))===JSON.stringify(row.helpers.map(h=>h.class)),row.id+' helper order');
   for(const h of row.helpers){const els=guide.querySelectorAll('.'+h.class);demand(els.length===1&&els[0].parentElement===section&&els[0].textContent===h.text,h.class+' exact text');}
   if(guide.open){const st=getComputedStyle(section.querySelector('h3'));demand(st.color==='rgb(167, 212, 111)'&&st.fontSize==='14px',row.id+' heading style');for(const h of row.helpers){const e=section.querySelector('.'+h.class);if(!e)continue;const s=getComputedStyle(e);demand(s.display==='block'&&s.fontSize==='14px'&&s.color==='rgb(247, 239, 207)',h.class+' readable style');}}
  }
  for(const h of f.unchanged){const els=guide.querySelectorAll('.'+h.class);demand(els.length===1&&els[0].parentElement===guide&&els[0].textContent===h.text,h.class+' unchanged');}
  demand(document.documentElement.scrollWidth<=innerWidth,'no overflow');return errors;
 },fixture);assert.deepEqual(result,[]);
}
async function run(){const {chromium}=require('playwright-core');const b=await chromium.launch({headless:true});try{for(const width of [390,1280]){const p=await b.newPage({viewport:{width,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));const response=await p.goto(process.argv[2]);assert.equal(response.status(),200);await p.waitForFunction(()=>!!window.__sunflower);await check(p);assert.equal(await p.locator('#phrase-guide').evaluate(e=>e.open),false);assert.equal(await p.locator('#phrase-guide section').first().evaluate(e=>e.checkVisibility()),false);await p.locator('#preset-five-note-fan').click();const snapshot=()=>p.evaluate(()=>{const h=window.__sunflower;return [h.heldInDrawnOrder(),h.undoDepth(),h.redoDepth(),h.root(),h.register(),h.soundEnabled(),h.rememberedDrawing()];});const before=await snapshot();await p.locator('#phrase-guide summary').click();await check(p);assert.deepEqual(await snapshot(),before);await p.locator('#phrase-guide summary').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#phrase-guide').evaluate(e=>e.open),false);assert.deepEqual(await snapshot(),before);assert.deepEqual(errors,[]);await p.close();}console.log('arranger guide groups exact explanations without changing the phrase');}finally{await b.close();}}
if(process.argv[2]==='facts')facts();else if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
module.exports={check,fixture};
