const memoryStore = require('./memoryStore')

function defaultSafelistedResponse(req, res, next) {
  return next()
}

function defaultBlocklistedResponse(req, res) {
  return res.status(403).send('Forbidden')
}

function defaultThrottledResponse(req, res) {
  return res.status(429).send('Too Many Requests')
}

function defaultNormalResponse(req, res, next) {
  return next()
}

function defaultErrorResponse(req, res, next) {
  return next()
}

function middleware({
  safelist = [],
  blocklist = [],
  throttles = [],
  safelistedResponse = defaultSafelistedResponse,
  blocklistedResponse = defaultBlocklistedResponse,
  throttledResponse = defaultThrottledResponse,
  normalResponse = defaultNormalResponse,
  errorResponse = defaultErrorResponse,
  store = memoryStore({})
}) {
  async function isSafelisted(req) {
    for (let i = 0, max = safelist.length; i < max; i++) {
      const safeFn = safelist[i]
      const matched = await safeFn(req)
      if (matched) {
        return true
      }
    }
    return false
  }

  async function isBlocklisted(req) {
    for (let i = 0, max = blocklist.length; i < max; i++) {
      const blockFn = blocklist[i]
      const matched = await blockFn(req)
      if (matched) {
        return true
      }
    }
    return false
  }

  async function isThrottled(req) {
    for (let i = 0, max = throttles.length; i < max; i++) {
      const throttleFn = throttles[i]
      const matched = await throttleFn(req)
      if (matched === true) {
        return true
      } else if (typeof matched === 'object' && !!matched) {
        const { key, limit, period } = matched
        if (key !== undefined && limit !== undefined && period !== undefined) {
          const count = await store.increment(key, period)
          if (count >= limit) {
            return true
          }
        }
      }
    }
    return false
  }

  return async function(req, res, next) {
    try {
      if (await isSafelisted(req)) {
        return safelistedResponse(req, res, next)
      } else if (await isBlocklisted(req)) {
        return blocklistedResponse(req, res)
      } else if (await isThrottled(req)) {
        return throttledResponse(req, res)
      } else {
        return normalResponse(req, res, next)
      }
    } catch (error) {
      return errorResponse(req, res, next)
    }
  }
}

module.exports = middleware
