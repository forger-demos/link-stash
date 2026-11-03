import {handle} from './app';
import {openDatabase} from './storage';

const db = openDatabase(process.env.LINK_STASH_DB ?? 'link-stash.db');
const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  fetch: (req) => handle(req, db),
});
console.log(`link-stash listening on ${server.url}`);
