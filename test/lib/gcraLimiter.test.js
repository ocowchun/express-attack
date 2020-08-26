describe('gcraLimiter', () => {
  jest.useFakeTimers()
  const GCRALimiter = require('../../lib/gcraLimiter')
  const realDate = Date;
  const now = new Date(2020, 5, 24);

  beforeAll(()=>{
    global.Date = jest.fn(() => now);
  })
  afterAll(()=>{
    global.Date = realDate;
  })

  describe('limit', () => {
    const burst = 5
    const emissionInterval = 1000
    const key = 'foo-bar'
    let store, limiter
    beforeEach(() => {
      store = {
        get: jest.fn((key) => undefined),
        set: jest.fn((key, newTat, period) => true)
      }
      limiter = GCRALimiter({
        store,
        burst,
        emissionInterval
      })
    })


    it("pass request when tat doesn't exists", async function() {
      const result = await limiter.limit(key)

      expect(result.limited).toEqual(false)
      expect(result.retryIn).toEqual(0)
      expect(result.remaining).toEqual(burst - 1)
      const resetIn = emissionInterval
      expect(result.resetIn).toEqual(resetIn)
      const newTat = now.getTime() + emissionInterval
      expect(store.set).toBeCalledWith(key, newTat, resetIn)
    })

    it('pass request when tat exists', async function() {
      const usedTokenCount = 2
      const tat = now.getTime() + (emissionInterval * usedTokenCount)
      store.get = jest.fn((key) => tat)

      const result = await limiter.limit(key)

      expect(result.limited).toEqual(false)
      expect(result.retryIn).toEqual(0)
      expect(result.remaining).toEqual(burst - (usedTokenCount + 1))
      const resetIn = (usedTokenCount + 1) * emissionInterval
      expect(result.resetIn).toEqual(resetIn)
      const newTat = tat + emissionInterval
      expect(store.set).toBeCalledWith(key, newTat, resetIn)
    })

    it('block request when tat exists and allowAt > now', async function() {
      const tat = now.getTime() + (emissionInterval * burst)
      store.get = jest.fn((key) => tat)

      const result = await limiter.limit(key)

      expect(result.limited).toEqual(true)
      expect(result.retryIn).toEqual(emissionInterval)
      expect(result.remaining).toEqual(0)
      expect(result.resetIn).toEqual(emissionInterval * burst)
      expect(store.set).not.toBeCalled()
    })
  })
})
