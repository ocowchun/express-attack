describe('memoryStore', () => {
  jest.useFakeTimers()
  const memoryStore = require('../../lib/memoryStore.js')
  const gcInterval = 10
  const realDate = Date;
  const now = new Date(2018, 8, 22);

  beforeAll(()=>{
    global.Date = jest.fn(() => now);
  })
  afterAll(()=>{
    global.Date = realDate;
  })
  beforeEach(() => {
    store = memoryStore({ gcInterval: 10 })
  })

  describe('set', () => {
    it('return 1 when key not exists', async function() {
      const key = 'your-magic-is-mine'
      const timestamp = new Date(2016, 7, 22).getTime()
      const period = 3000

      await store.set(key, timestamp, period)

      expect(store.store[key].timestamp).toEqual(timestamp)
      expect(store.store[key].expireAt).toEqual(now.getTime() + period)
    })
  })

  it('trigger gc', async function() {
    const advanceInterval = gcInterval * 1000
    const timestamp = new Date(2016, 7, 22).getTime()
    const expiredKey = 'your-magic-is-mine'
    await store.set(expiredKey, timestamp, advanceInterval - 500)
    const activeKey = 'ready-to-ride'
    await store.set(activeKey, timestamp, advanceInterval + 500)

    global.Date = jest.fn(() => new realDate(now.getTime() + advanceInterval))
    jest.advanceTimersByTime(advanceInterval)

    expect(store.store[expiredKey]).toEqual(undefined)
    expect(store.store[activeKey].timestamp).toEqual(timestamp)
  })
})
