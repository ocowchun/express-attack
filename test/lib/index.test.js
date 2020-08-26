function fakeRequest({ method, headers, path }) {
  return {
    method,
    headers: headers || {
      origin: 'request.com',
      'access-control-request-headers': 'requestedHeader1,requestedHeader2'
    },
    path
  }
}
function fakeResponse() {
  const res = {
    status: function(statusCode) {
      res.statusCode = statusCode
      return res
    },
    send: jest.fn()
  }
  return res
}

describe('attack', () => {
  const attack = require('../../lib/index.js')
  const GCRALimiter = require('../../lib/gcraLimiter')
  jest.mock('../../lib/gcraLimiter')

  let next, req, res
  beforeEach(() => {
    res = fakeResponse()
    next = jest.fn()
  })

  describe('safelist', () => {
    test('Always pass', async () => {
      req = fakeRequest({
        method: 'GET'
      })

      await attack({ safelist: [() => true] })(req, res, next)

      expect(next).toBeCalled()
    })
  })

  describe('blocklist', () => {
    test('Always block', async () => {
      req = fakeRequest({
        method: 'GET'
      })

      await attack({ blocklist: [() => true] })(req, res, next)

      expect(res.statusCode).toEqual(403)
      expect(res.send).toBeCalledWith('Forbidden')
    })
  })

  describe('throttles', () => {
    test('Always throttle', async () => {
      req = fakeRequest({
        method: 'GET'
      })

      await attack({ throttles: [() => true] })(req, res, next)

      expect(res.statusCode).toEqual(429)
      expect(res.send).toBeCalledWith('Too Many Requests')
    })

    describe('Use custom throttle function', () => {
      const key = 'yoooo'
      const burst = 10
      const emissionInterval = 1000
      const period = 300
      const throttleFn = req => {
        return { key, burst, emissionInterval }
      }
      let middleware, testStore

      beforeEach(() => {
        req = fakeRequest({
          method: 'GET',
          path: 'foo'
        })
      })

      function computeCurrentStep(period) {
        const periodMs = period * 1000
        const currentTimestamp = new Date().getTime()
        return Math.ceil(currentTimestamp / periodMs) * periodMs
      }

      test('return throttle if request hit limit', async () => {
        testStore = {
          set: jest.fn(() => 3),
          get: jest.fn(() => 0)
        }
        middleware = attack({
          throttles: [throttleFn],
          store: testStore
        })
        const mockLimiter = { limit: jest.fn(() => Promise.resolve({ limited: true })) }
        GCRALimiter.mockImplementation(() => mockLimiter)

        await middleware(req, res, next)

        expect(res.statusCode).toEqual(429)
        expect(res.send).toBeCalledWith('Too Many Requests')
        expect(GCRALimiter).toBeCalledWith({ store: testStore, burst, emissionInterval })
        expect(mockLimiter.limit).toBeCalledWith(key)
      })

      test('pass if request does not hit limit', async () => {
        testStore = {
          increment: jest.fn(() => 0),
          get: jest.fn(() => 0)
        }
        middleware = attack({
          throttles: [throttleFn],
          store: testStore
        })
        const mockLimiter = { limit: jest.fn(() => Promise.resolve({ limited: false })) }
        GCRALimiter.mockImplementation(() => mockLimiter)

        await middleware(req, res, next)

        expect(next).toBeCalled()
      })
    })
  })

  describe('blocklistedResponse', () => {
    test('retrun custom blocklisted response', async () => {
      req = fakeRequest({
        method: 'GET'
      })
      const blocklistedResponse = (req, res) => {
        return res.status(503).send('Service Unavailable')
      }

      await attack({ blocklist: [() => true], blocklistedResponse })(
        req,
        res,
        next
      )

      expect(res.statusCode).toEqual(503)
      expect(res.send).toBeCalledWith('Service Unavailable')
    })
  })

  describe('throttledResponse', () => {
    test('retrun custom throttled response', async () => {
      req = fakeRequest({
        method: 'GET'
      })
      const throttledResponse = (req, res) => {
        return res.status(503).send('Service Unavailable')
      }

      await attack({ throttles: [() => true], throttledResponse })(
        req,
        res,
        next
      )

      expect(res.statusCode).toEqual(503)
      expect(res.send).toBeCalledWith('Service Unavailable')
    })
  })
})
