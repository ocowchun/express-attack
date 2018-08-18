function fakeRequest({ method, headers, path }) {
  return {
    method: method,
    headers: headers || {
      origin: 'request.com',
      'access-control-request-headers': 'requestedHeader1,requestedHeader2'
    }
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
  const attack = require('../index.js')
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
