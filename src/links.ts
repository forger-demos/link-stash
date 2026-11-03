export interface LinkInput {
  url: string;
  title: string;
  tags: string[];
}

export type Validation = {ok: true; value: LinkInput} | {ok: false; field: 'url' | 'title'; message: string};

export function parseTags(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
  const tags = parts.filter((p): p is string => typeof p === 'string').map((p) => p.trim().toLowerCase()).filter(Boolean);
  return [...new Set(tags)];
}

export function validateLink(body: unknown): Validation {
  const raw = (body ?? {}) as Record<string, unknown>;
  const url = typeof raw.url === 'string' ? raw.url.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  let parsed: URL | null = null;
  try {
    parsed = new URL(url);
  } catch {
    parsed = null;
  }
  if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
    return {ok: false, field: 'url', message: 'url must be an http or https address'};
  }
  return {ok: true, value: {url, title, tags: parseTags(raw.tags)}};
}
