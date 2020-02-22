let sandbox = require('@architect/sandbox')
let tiny = require('tiny-json-http')

let end 
beforeAll(async () => {
  end = await sandbox.start()
})

afterAll(async () => {
  await end()
})

test('get /api/sickpicks', async () => {
  let url = 'http://localhost:3333/api/sickpicks'
  await tiny.get({url})
})

test('get /api/shows', async () => {
  let url = 'http://localhost:3333/api/shows'
  await tiny.get({url})
})

test('get /api/shows/1', async () => {
  let url = 'http://localhost:3333/api/shows/1'
  await tiny.get({url})
})
