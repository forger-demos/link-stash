import {expect, test} from 'bun:test';
import {validateLink} from './links';

test('accepts http and https and trims', () => {
  expect(validateLink({url: ' https://example.com/a ', title: ' T '})).toEqual({
    ok: true,
    value: {url: 'https://example.com/a', title: 'T'},
  });
  expect(validateLink({url: 'http://example.com'})).toEqual({
    ok: true,
    value: {url: 'http://example.com', title: ''},
  });
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
