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

  it('return 1 when key not exists', async function() {
    const result = await store.increment('a', 20)

    expect(result).toEqual(1)
  })

  it('return 2 when key exists', async function() {
    store.increment('a', 20)

    const result = await store.increment('a', 20)

    expect(result).toEqual(2)
  })

  it('trigger gc', async function() {
    store.increment('a', 20)

    jest.advanceTimersByTime(gcInterval * 1000)

    expect(store.store).toEqual({})
  })
})
