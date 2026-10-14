import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { servePublicFile } from './static-files.mjs';
import { verifyToken, createToken, publicUser } from '../backend/lib/auth.mjs';
import { buildSearchQuery, matchesFilters, normalizeFilters, resolveSearchTerm } from '../search-policy.js';
import { OpenLibraryCatalogApi } from '../open-library-api.js';
assert.equal(verifyToken('a.b.c'),null);
assert.equal(verifyToken('a.b.c.d'),null);
assert.equal(verifyToken(''),null);
assert.equal(verifyToken(createToken({id:'test',email:'test@example.test',name:'Test'})).sub,'test');
assert.equal(publicUser({id:'reader',role:'reader'}).role,'reader');
assert.equal(publicUser({id:'admin',role:'admin'}).role,'admin');
assert.equal(publicUser({id:'legacy'}).role,'reader');
const accountApi=await (await import('node:fs/promises')).readFile(new URL('../account-api.js',import.meta.url),'utf8');
assert.doesNotMatch(accountApi,/MASTER_PASSWORD|MASTER_EMAIL\s*=|manoelbrendo@gmail\.com|12345678/);
assert.equal(resolveSearchTerm('O HÓBBIT'),'The Hobbit');
assert.equal(resolveSearchTerm('Alice no País das Maravilhas'),"Alice's Adventures in Wonderland");
assert.throws(()=>normalizeFilters({from:2000,to:1900}));
assert.ok(buildSearchQuery('fantasy',{author:'Tolkien',from:1900,to:2000,publicOnly:true}).includes('ebook_access:public'));
assert.equal(matchesFilters({author:'Tolkien',year:1937,publicDomain:false},{publicOnly:true}),false);
const originalFetch=globalThis.fetch;
try {
 globalThis.fetch=async()=>({ok:true,json:async()=>({numFound:1,docs:[{key:'/works/OL1W',title:'Other language',cover_i:123,editions:{docs:[{key:'/books/OL2M',title:'English edition',language:['eng'],cover_i:456,ebook_access:'public'}]}}]})});
 const book=(await new OpenLibraryCatalogApi().searchBooks({query:'edition-test'})).books[0];
 assert.equal(book.titleLanguage,'pt');assert.equal(book.title,'Edição em Inglês');assert.equal(book.editionId,'/books/OL2M');assert.ok(book.coverCandidates.every(url=>!url.includes('123')));assert.equal(book.readUrl,'https://openlibrary.org/books/OL2M');
 globalThis.fetch=async()=>({ok:true,json:async()=>({numFound:1,docs:[{key:'/works/OL1W',title:'Unknown title'}]})});
 const unknown=(await new OpenLibraryCatalogApi().searchBooks({query:'unknown-test'})).books[0];
 assert.equal(unknown.titleLanguage,'pt');assert.ok(unknown.titleNote);
 const controller=new AbortController();controller.abort();
 await assert.rejects(new OpenLibraryCatalogApi().searchBooks({signal:controller.signal}),{name:'AbortError'});
} finally {globalThis.fetch=originalFetch;}
const server=createServer((req,res)=>servePublicFile(req,res,process.cwd()));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const file of ['/','/livros.html','/compra.html','/login.html','/assets/site-polish.css','/render-books.js','/data/books.js','/data/editorial.js']) assert.equal((await fetch(base+file)).status,200);
 for(const file of ['/data/missing.js','/data/.hidden.js','/other/nested.js']) assert.equal((await fetch(base+file)).status,404);
 for(const file of ['/missing.js','/backend/data/bosque-db.json','/.git/config','/package.json','/backend/server.mjs']) assert.equal((await fetch(base+file)).status,404);
 assert.equal((await fetch(base+'/%E0%A4%A')).status,400);
 console.log('OK: title policy, edition consistency, filters, token handling and public file isolation.');
} finally {server.close();}
