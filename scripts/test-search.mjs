import assert from 'node:assert/strict';
import { OpenLibraryCatalogApi } from '../open-library-api.js';
import { BosqueCatalogApi } from '../catalog-api.js';
import { featuredBooks } from '../site-data.js';
const api = new OpenLibraryCatalogApi();
const url = api.buildUrl({query: 'Tolkien OR Lewis'});
assert.equal(url.searchParams.get('lang'), 'en');
assert.equal(url.searchParams.get('q'), '(Tolkien OR Lewis) language:eng');
assert.ok(url.searchParams.get('fields').includes('editions.title'));
const originalFetch = globalThis.fetch;
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
try {
 globalThis.fetch = async () => ({ok: true, json: async () => ({numFound: 1, docs: [{key:'/works/OL1W',title:'Titulo da obra',editions:{docs:[{title:'The English Edition',language:['eng']}]}}]})});
 const result = await api.searchBooks({query:'test'});
 assert.equal(result.books[0].title, 'A Edição em Inglês');
 assert.equal(result.books[0].originalTitle, 'The English Edition');
 assert.equal(result.total, 1);
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
