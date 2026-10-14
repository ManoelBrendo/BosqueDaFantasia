import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel: 'msedge',headless:true});
await mkdir('artifacts/qa',{recursive:true});
const context = await browser.newContext({serviceWorkers:'block'});
let calls=[];
const doc=(id,title)=>({key:`/works/OL${id}W`,title:'Titulo da obra',author_name:['J. R. R. Tolkien'],first_publish_year:1937,editions:{docs:[{key:`/books/OL${id}M`,title,language:['eng'],ebook_access:'public'}]}});
await context.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.hostname==='127.0.0.1') return route.continue();
 if(url.hostname==='openlibrary.org' && url.pathname==='/search.json') {
  calls.push(url);const q=url.searchParams.get('q'); const page=Number(url.searchParams.get('page'));
  if(q.includes('slow')) await new Promise(resolve=>setTimeout(resolve,300));
  if(q.includes('failure')) return route.abort();
  const docs=q.includes('slow')?[doc(88,'Stale Search')]:q.includes('fast')?[doc(89,'Latest Search')]:q.includes('empty')?[]:q.includes('key:/works/OL99W')?[doc(99,'Direct Link Book')]:page===2?[doc(1,'Zebra Book'),doc(3,'Middle Book')]:[doc(1,'Zebra Book'),doc(2,'Alpha Book')];
  return route.fulfill({json:{numFound:docs.length?18:0,docs}});
 }
 return route.abort();
});
const page=await context.newPage();const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try {
 await page.goto('http://127.0.0.1:4173/livros.html?q=o+hobbit');
 await page.locator('.book-card').first().waitFor();
 assert.ok(calls[0].searchParams.get('q').includes('The Hobbit'));
 assert.equal(await page.locator('.book-copy h3').first().textContent(),'Zebra Book');
 await page.locator('#catalog-load-more').click();
 await page.waitForFunction(()=>document.querySelectorAll('.book-card').length===3);
 const before=calls.length;
 await page.locator('#catalog-sort').selectOption('title');
 assert.equal(calls.length,before);
 assert.equal(await page.locator('.book-copy h3').first().textContent(),'Alpha Book');
 await page.locator('.book-link').first().click();
 await page.waitForURL('**/compra.html?**');
 assert.equal(await page.locator('#purchase-title').textContent(),'Alpha Book');
 await page.locator('#purchase-back').click();
 await page.locator('.book-card').first().waitFor();
 assert.equal(await page.locator('.book-card').count(),3);
 assert.equal(await page.locator('#catalog-sort').inputValue(),'title');
 await page.locator('#catalog-filter-panel > summary').click();
 await page.locator('#catalog-author').fill('Tolkien');
 await page.locator('#catalog-from').fill('1900');
 await page.locator('#catalog-to').fill('2000');
 await page.locator('#catalog-public').check();
 await page.locator('#catalog-submit').click();
 await page.waitForFunction(()=>document.querySelector('#results-grid').getAttribute('aria-busy')==='false');
 assert.ok(calls.at(-1).searchParams.get('q').includes('author:"Tolkien"'));
 assert.ok(calls.at(-1).searchParams.get('q').includes('first_publish_year:[1900 TO 2000]'));
 await page.locator('#catalog-search').fill('empty');await page.locator('#catalog-submit').click();
 await page.locator('.catalog-empty').waitFor();
 await page.locator('#catalog-search').fill('failure');await page.locator('#catalog-submit').click();
 await page.locator('#catalog-retry').waitFor({state:'visible'});
 await page.locator('#catalog-search').fill('slow');await page.locator('#catalog-submit').click();
 await page.locator('#catalog-search').fill('fast');await page.locator('#catalog-submit').click();
 await page.waitForFunction(()=>document.querySelector('.book-copy h3')?.textContent==='Latest Search');
 await page.waitForTimeout(400);
 assert.equal(await page.locator('.book-copy h3').first().textContent(),'Latest Search');
 await context.setOffline(true);
 await page.locator('#catalog-submit').click();
 await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Resultados salvos'));
 await context.setOffline(false);
 await page.goto('http://127.0.0.1:4173/login.html');
 await page.locator('#email').fill('invalid@example.test');await page.locator('#password').fill('incorrect');
 await page.locator('.submit-button').click();
 await page.waitForFunction(()=>document.querySelector('#feedback').classList.contains('error'));
 assert.equal(await page.locator('.submit-button').isEnabled(),true);
 await page.goto('http://127.0.0.1:4173/compra.html?book=OL99W');
 await page.waitForFunction(()=>document.querySelector('#purchase-title').textContent==='Direct Link Book');
 await page.goto('http://127.0.0.1:4173/compra.html?book=invalid');
 await page.waitForFunction(()=>document.querySelector('#purchase-title').textContent==='Livro não encontrado');
 const overflow=[];
 for(const width of [320,375,390,768,1440]) {
  await page.setViewportSize({width,height:900});
  for(const file of ['index.html','livros.html','compra.html?book=OL99W','login.html']) {
   await page.goto(`http://127.0.0.1:4173/${file}`);
   if(file==='livros.html') await page.locator('.book-card').first().waitFor();
   const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
   if(layout.scroll>width+1) overflow.push({file,width,...layout});
   if(width===390 || width===1440) {
    await page.evaluate(async () => { for(let y=0;y<document.documentElement.scrollHeight;y+=700) { scrollTo({top:y,behavior:"instant"}); await new Promise(resolve=>setTimeout(resolve,70)); } scrollTo({top:0,behavior:"instant"}); });
    await page.waitForTimeout(850);
    await page.screenshot({path:`artifacts/qa/${file.split('.')[0]}-${width}.png`,fullPage:true});
   }
  }
 }
 console.log(JSON.stringify({passed:'search, aliases, filters, pagination, sorting, detail identity, return state, empty and failure states',overflow,errors},null,2));
 assert.deepEqual(overflow,[]);assert.deepEqual(errors,[]);
} finally { await browser.close(); }
