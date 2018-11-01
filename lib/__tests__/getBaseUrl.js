import getBaseUrl from '../getBaseURL';

test('getBaseUrl()', () => {
  const req = {
    protocol: 'https',
    headers: {
      host: 'syntax.fm'
    }
  }
  expect(getBaseUrl(req)).toBe('https://syntax.fm')
});
