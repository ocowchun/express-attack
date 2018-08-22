# express-attack
> Express middleware for blocking and throttling inspired by [rack-attack](https://github.com/kickstarter/rack-attack)

## Installation
```sh
$ yarn install express-attack
```

## Usage

```js
const express = require('express')
const expressAttack = require('express-attack')
const requestIp = require('request-ip')
const app = express()

function localReq(req) {
  const clientIp = requestIp.getClientIp(req)
  return clientIp === '127.0.0.1' || clientIp === '::1'
}

const BAD_BOTS = ['bad-bot', 'evil-bot']
function badBot(req) {
  const userAgent = req.headers['user-agent'] || 'unknown'
  const found = BAD_BOTS.find(function(badBot) {
    return userAgent.indexOf(badBot) >= 0
  })
  return !!found
}

app.use(
  expressAttack({
    safelist: [localReq],
    blocklist: [badBot]
  })
)

app.get('/foo', function(req, res, next) {
  res.json({ msg: 'bar' })
})

app.listen(3000, function() {
  console.log('The server is running at http://localhost:3000')
})

```

## Throttling
Using [memoryStore](https://github.com/ocowchun/express-attack/blob/master/lib/memoryStore.js) to store throttled state by default, you can use your own store.

```js
// throttle request when given IP hit 50 times over 300 seconds
function throttleByIp(req) {
  const clientIp = requestIp.getClientIp(req)

  return {
    key: clientIp
    limit: 50
    period: 300
  }
}

app.use(
  expressAttack({
    throttles: [throttleByIp]
  })
)
```

### Custom your store
Create an object with `increment` function which will receive `key` and `period` and retrun `count`.

```js
function dummyStore() {
  const store = {}
  const increment = function(key, period) {
    const currentTimestamp = new Date().getTime()
    const expireIn = Math.ceil(currentTimestamp / period) * period
    if (store[expireIn] === undefined) {
      store[expireIn] = {}
    }
    if (store[expireIn][key] === undefined) {
      store[expireIn][key] = 0
    }
    store[expireIn][key] = store[expireIn][key] + 1
    return store[expireIn][key]
  }

  return {
    increment
  }
}


app.use(
  expressAttack({
    throttles: [throttleByIp],
    store: dummyStore()
  })
)
```

## Customizing responses
```js
// do what ever you want with response.
const blocklistedResponse = (req, res) => {
  return res.status(503).send('Service Unavailable')
}

const throttledResponse = (req, res) => {
  return res.status(503).send('Service Unavailable')
}

app.use(
  expressAttack({
    blocklistedResponse
    throttledResponse
  })
)
```


MIT