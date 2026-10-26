import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const contrastRatio = (foreground, background) => {
 const luminance = color => {
  let channels;
  if(color.startsWith('#')) {
   const hex=color.slice(1);
   const expanded=hex.length===3?hex.split('').map(character=>character+character).join(''):hex;
   channels=[0,2,4].map(index=>parseInt(expanded.slice(index,index+2),16));
  } else {
   channels=color.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number) || [];
  }
  assert.equal(channels.length,3,`Expected an RGB color, received ${color}`);
  const [red,green,blue] = channels.map(value => {
   const normalized=value/255;
   return normalized<=.04045?normalized/12.92:((normalized+.055)/1.055)**2.4;
  });
  return .2126*red+.7152*green+.0722*blue;
 };
 const first=luminance(foreground),second=luminance(background);
 return (Math.max(first,second)+.05)/(Math.min(first,second)+.05);
};
const launchOptions = { headless: true };
if (process.env.BOSQUE_BROWSER_EXECUTABLE_PATH) {
 launchOptions.executablePath = process.env.BOSQUE_BROWSER_EXECUTABLE_PATH;
} else {
 launchOptions.channel = process.env.BOSQUE_BROWSER_CHANNEL || 'msedge';
}
const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});
await context.route('**/*', route => {
 const url=new URL(route.request().url());
 if(url.hostname==='127.0.0.1') return route.continue();
 if(url.hostname==='openlibrary.org' && url.pathname==='/search.json') return route.fulfill({json:{numFound:1,docs:[{key:'/works/OL99W',title:'The Hobbit',author_name:['J. R. R. Tolkien'],first_publish_year:1937,editions:{docs:[{key:'/books/OL99M',title:'The Hobbit',language:['eng']}]}}]}});
 return route.abort();
});
await mkdir('artifacts/qa',{recursive:true});
const page=await context.newPage();const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try {
 for(const file of ['index.html','livros.html','compra.html?book=OL99W','login.html']) {
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/'+file);
  assert.equal(await page.locator('main').count(),1);
  assert.notEqual(await page.locator('body').evaluate(element=>getComputedStyle(element).cursor),'none');
  assert.equal(await page.locator('.magic-cursor').count(),0);
  if(file==='index.html') {
   assert.equal(await page.locator('link[href*="aos"],script[src*="aos"],link[href*="animate.css"],[data-aos],.animate__animated,script[src*="anime"],script[src*="gsap"],link[href*="cdnjs.cloudflare"],link[href*="cdn.jsdelivr.net"]').count(),0);
   assert.equal(await page.locator('#ambient-audio').getAttribute('preload'),'none');
   const audioRequests=[];
   page.on('request',request=>{
    if(request.url().includes('O_frondens_2.ogg')) audioRequests.push(request.url());
   });
   await page.waitForTimeout(300);
   assert.deepEqual(audioRequests,[],'ambient audio should wait until the reader presses play');
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.className),'skip-link');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main-content');
  await page.locator('#site-menu-toggle').click();
  assert.equal(await page.locator('#primary-navigation').isVisible(),true);
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(()=>document.activeElement.closest('#primary-navigation')!==null));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#primary-navigation').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'site-menu-toggle');
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#primary-navigation').waitFor({state:'visible'});
  await page.locator('#site-menu-toggle').waitFor({state:'hidden'});
  assert.equal(await page.locator('#primary-navigation').isVisible(),true);
  assert.equal(await page.locator('#site-menu-toggle').isVisible(),false);
  if(file.startsWith('compra')) await page.waitForFunction(()=>document.querySelector('#purchase-title').textContent==='O Hobbit');
  const palette=await page.evaluate(()=>{
   const styles=getComputedStyle(document.documentElement);
   return Object.fromEntries(['--text','--muted','--gold','--gold-soft','--bg','--panel'].map(token=>[token,styles.getPropertyValue(token).trim()]));
  });
  for(const [foreground,background] of [['--text','--bg'],['--muted','--panel'],['--gold','--bg'],['--gold-soft','--panel']]) {
   const ratio=contrastRatio(palette[foreground],palette[background]);
   assert.ok(ratio>=4.5,`${file}: ${foreground} against ${background} has ${ratio.toFixed(2)}:1 contrast`);
  }
  if(file==='livros.html') {
   const field=await page.locator('#catalog-author').evaluate(element=>{
    const styles=getComputedStyle(element);
    return {text:styles.color,background:styles.backgroundColor,placeholder:getComputedStyle(element,'::placeholder').color};
   });
   assert.ok(contrastRatio(field.text,field.background)>=4.5,'catalog filter text meets WCAG AA contrast');
   assert.ok(contrastRatio(field.placeholder,field.background)>=4.5,'catalog filter placeholder meets WCAG AA contrast');
  }
  await page.screenshot({path:`artifacts/qa/redesign-${file.split('.')[0]}-desktop.png`});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`artifacts/qa/redesign-${file.split('.')[0]}-mobile.png`});
  await page.setViewportSize({width:320,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),file+' reflows without horizontal scrolling at 320px');
  const problems=await page.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(el=>el.getClientRects().length && !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(el=>el.id));
  assert.deepEqual(problems,[],file+' unlabelled inputs');
 }
 await page.locator('#password').fill('example-password');
 await page.locator('#password-toggle').click();
 assert.equal(await page.locator('#password').getAttribute('type'),'text');
 await page.locator('#password-toggle').click();
 assert.equal(await page.locator('#password').getAttribute('type'),'password');
 await page.goto('http://127.0.0.1:4173/livros.html');
 await page.locator('#catalog-filter-panel summary').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#catalog-author').isVisible(),true);
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'catalog-author');
 await page.setViewportSize({width:320,height:700});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Simulate an expired local session only in this isolated test context.
 await page.addInitScript(()=>localStorage.setItem('bosque-api-token','local:qa-expired'));
 await page.goto('http://127.0.0.1:4173/index.html');
 await page.locator('.auth-gate.is-required').waitFor();
 assert.equal(await page.locator('.auth-gate').getAttribute('role'),'dialog');
 assert.equal(await page.locator('.site-shell').getAttribute('inert'),'');
 await page.locator('#auth-dismiss').focus();await page.keyboard.press('Shift+Tab');
 assert.ok(await page.evaluate(()=>document.activeElement.closest('.auth-gate')!==null));
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.querySelector('.site-shell').hasAttribute('inert'));
 assert.equal(await page.locator('.auth-gate').isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('OK: four-page keyboard navigation, skip links, menu breakpoints, visible labels, password visibility, expandable filters, WCAG AA text contrast, narrow reflow, reduced motion and dialog focus.');
} finally { await browser.close(); }
