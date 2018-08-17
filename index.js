function middleware({ safelist = [], blocklist = [], throttles = [] }) {
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
      if (matched) {
        return true
      }
    }
    return false
  }

  return async function(req, res, next) {
    try {
      if (await isSafelisted(req)) {
        return next()
      } else if (await isBlocklisted(req)) {
        return res.status(403).send('Forbidden')
      } else if (await isThrottled(req)) {
        return res.status(429).send('Too Many Requests')
      } else {
        return next()
      }
    } catch (error) {
      next()
    }
  }
}

module.exports = middleware
