let sandbox = require('@architect/sandbox')
let shows = require('../src/shared/shows')

test('env', async () => {
  expect(!!shows).toBe(true)
  expect(!!shows.getShow).toBe(true)
  expect(!!shows.getShows).toBe(true)
  expect(!!shows.getSickPicks).toBe(true)
})

test('shows', async () => {
  let result = await shows.getShows()
  expect(result.length > 0).toBe(true)
})
