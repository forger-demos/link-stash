import type {Database} from 'bun:sqlite';
import {health} from './health';
import {parseTags, validateLink} from './links';
import {addLink, listLinks} from './storage';

const publicDir = new URL('../public/', import.meta.url);

const json = (body: unknown, status = 200): Response => Response.json(body, {status});

export async function handle(req: Request, db: Database): Promise<Response> {
  const {pathname, searchParams} = new URL(req.url);
  if (pathname === '/api/links') {
    if (req.method === 'GET') return json({links: listLinks(db, parseTags(searchParams.get('tag'))[0])});
    if (req.method === 'POST') {
      const result = validateLink(await req.json().catch(() => null));
      if (!result.ok) return json({error: result.message, field: result.field}, 400);
      return json(addLink(db, result.value.url, result.value.title, result.value.tags), 201);
    }
    return json({error: 'method not allowed'}, 405);
  }
  if (req.method !== 'GET') return json({error: 'method not allowed'}, 405);
  if (pathname === '/api/health') return json(health());
  if (pathname.startsWith('/api/')) return json({error: 'not found'}, 404);

  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (name.split('/').includes('..')) return json({error: 'not found'}, 404);
  const file = Bun.file(new URL(name, publicDir));
  return (await file.exists()) ? new Response(file) : json({error: 'not found'}, 404);
}
