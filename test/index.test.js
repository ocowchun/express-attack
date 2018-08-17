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
})
