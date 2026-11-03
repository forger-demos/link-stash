import {expect, test} from 'bun:test';
import {parseTags, validateLink} from './links';

test('accepts http and https and trims', () => {
  expect(validateLink({url: ' https://example.com/a ', title: ' T '})).toEqual({
    ok: true,
    value: {url: 'https://example.com/a', title: 'T', tags: []},
  });
  expect(validateLink({url: 'http://example.com'})).toEqual({
    ok: true,
    value: {url: 'http://example.com', title: '', tags: []},
  });
});

test('tags are split, trimmed, lower-cased and de-duplicated', () => {
  expect(parseTags(' News, dev ,,NEWS,')).toEqual(['news', 'dev']);
  expect(parseTags(['A', ' b ', 5])).toEqual(['a', 'b']);
  expect(parseTags(undefined)).toEqual([]);
  expect(parseTags(null)).toEqual([]);
});

test.each([[{url: 'ftp://example.com'}], [{url: 'javascript:alert(1)'}], [{url: 'example.com'}], [{url: ''}], [{}], [null], [{url: 5}]])(
  'refuses %p naming the url field',
  (body) => {
    const r = validateLink(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.field).toBe('url');
      expect(r.message).toContain('url');
    }
  },
);
