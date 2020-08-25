describe('memoryStore', () => {
  jest.useFakeTimers()
  const memoryStore = require('../../lib/memoryStore.js')
  const gcInterval = 10
  const realDate = Date;
  const myDate = new Date(2018, 8, 22);

  beforeAll(()=>{
    global.Date = jest.fn(() => myDate);
  })
  afterAll(()=>{
    global.Date = realDate;
  })
  beforeEach(() => {
    store = memoryStore({ gcInterval: 10 })
  })

  describe('increment', () => {
    it('return 1 when key not exists', async function() {
      const result = await store.increment('a', 20)

      expect(result).toEqual(1)
    })

    it('return 2 when key exists', async function() {
      store.increment('a', 20)

      const result = await store.increment('a', 20)

      expect(result).toEqual(2)
    })
  })

  it('trigger gc', async function() {
    store.increment('a', 20)

    jest.advanceTimersByTime(gcInterval * 1000)

    expect(store.store).toEqual({})
  })

  describe('get', () => {
    it('return number when key exists', async function() {
      const period = 60
      const periodMs = period * 1000
      const currentTimestamp = new Date().getTime()
      const expireIn = Math.ceil(currentTimestamp / periodMs) * periodMs
      const key = 'foo'
      store.store[expireIn] = { [key]: 5 }

      const result = await store.get(key, period)

      expect(result).toEqual(5)
    })

    it("return 0 when key doesn't exists", async function() {
      const result = await store.get('foo', 60)

      expect(result).toEqual(0)
    })
  })
})
