import assert from 'node:assert/strict';
import { OpenLibraryCatalogApi, translateBookTitle } from '../open-library-api.js';
import { BosqueCatalogApi } from '../catalog-api.js';
import { featuredBooks } from '../site-data.js';
const api = new OpenLibraryCatalogApi();
const url = api.buildUrl({query: 'Tolkien OR Lewis'});
assert.equal(url.searchParams.get('lang'), 'en');
assert.equal(url.searchParams.get('q'), '(Tolkien OR Lewis) language:eng');
assert.ok(url.searchParams.get('fields').includes('editions.title'));
assert.equal(translateBookTitle('The Last Unicorn'), 'O Último Unicórnio');
assert.equal(translateBookTitle('The Fellowship of the Ring'), 'A Sociedade do Anel');
const originalFetch = globalThis.fetch;
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
try {
 globalThis.fetch = async () => ({ok: true, json: async () => ({numFound: 1, docs: [{key:'/works/OL1W',title:'Titulo da obra',editions:{docs:[{title:'The English Edition',language:['eng']}]}}]})});
 const result = await api.searchBooks({query:'test'});
 assert.equal(result.books[0].title, 'A Edição em Inglês');
 assert.equal(result.books[0].originalTitle, 'The English Edition');
 assert.equal(result.total, 1);
 globalThis.fetch = async () => ({ok: true, json: async () => ({numFound: 1, docs: [{
  key:'/works/OL2W',
  title:'The Last Unicorn',
  author_name:['Peter S. Beagle'],
  editions:{docs:[
   {title:'The Last Unicorn',language:['eng']},
   {title:'O Último Unicórnio',language:['por']}
  ]}
 }]})});
 const portugueseEdition = await new OpenLibraryCatalogApi().searchBooks({query:'unicorn'});
 assert.equal(portugueseEdition.books[0].title, 'O Último Unicórnio');
 assert.equal(portugueseEdition.books[0].originalTitle, 'The Last Unicorn');
 globalThis.fetch = async () => { throw new DOMException('Aborted','AbortError'); };
 await assert.rejects(new OpenLibraryCatalogApi().searchBooks({query:'abort'}), {name:'AbortError'});
 Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: true },
  configurable: true
 });
 const catalog = new BosqueCatalogApi();
 catalog.database.getQuery = async () => ({books:[{title:'stale'}]});
 catalog.remoteApi.searchBooks = async () => { throw new DOMException('Aborted','AbortError'); };
 await assert.rejects(catalog.searchBooks({query:'abort'}), {name:'AbortError'});
 const offlineCatalog = new BosqueCatalogApi();
 offlineCatalog.database.getQuery = async () => null;
 offlineCatalog.database.searchBooks = async () => [{
  id:'OL3W', title:'The Last Unicorn', titleLanguage:'pt', originalTitle:'The Last Unicorn', author:'Peter S. Beagle'
 }];
 offlineCatalog.remoteApi.searchBooks = async () => { throw new Error('offline'); };
 const offlineResult = await offlineCatalog.searchBooks({query:'unicorn'});
 assert.equal(offlineResult.source, 'offline-db');
 assert.equal(offlineResult.books[0].title, 'O Último Unicórnio');
 assert.equal(offlineResult.books[0].titleLanguage, 'pt');
 assert.ok(featuredBooks.every(book => book.title === book.originalTitle));
 console.log('OK: Portuguese display titles, query scope, local titles and cancellation regressions.');
} finally {
 globalThis.fetch = originalFetch;
 if (originalNavigator) {
  Object.defineProperty(globalThis, 'navigator', originalNavigator);
 } else {
  delete globalThis.navigator;
 }
}
