# express-attack
> Express middleware for blocking and throttling inspired by [rack-attack](https://github.com/kickstarter/rack-attack) and [Node Redis GCRA Library](https://github.com/Losant/redis-gcra)

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
[GCRA](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm) is used for throttling. Default store is [memoryStore](https://github.com/ocowchun/express-attack/blob/master/lib/memoryStore.js), you can create your own store.

```js
// If I want to allow 2 request per second and at most 6 requests simultaneously, then:
// emissionInterval = period / rate => 1000 milliseconds / 2 reqs => 500
// burst => 6

function throttleByIp(req) {
  const clientIp = requestIp.getClientIp(req)

  return {
    key: clientIp
    burst 6,
    emissionInterval: 500
  }
}

app.use(
  expressAttack({
    throttles: [throttleByIp]
  })
)
```

### Create your store
Create an object with below methods:
`get(key)`: retrun value according to `key`, if `key` doesn't exsits return `undefined`.
`set(key, timestamp, period)`: assign `timestamp` to `key`, and expire the key after `period` milliseconds.


```js
function dummyStore() {
  const store = {}
  const get = async function(key) {
    return store[key]
  }
  const set = async function(key, timestamp, period) {
    store[key] = timestamp
  }

  return {
    get,
    set
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

## Options
* `safelist`: array of safe request functions, if one of the fucntion return `true`, ths request is allowed to go.
* `blocklist`: array of block request functions, if one of the function reutrn `true`, the request is blocked.
* `throttles`: array of throttle functions, check [Throttling](https://github.com/ocowchun/express-attack#throttling) for detail.
* `safelistedResponse(req, res, next)`: custom your response when request is mark as `safelisted`.
* `blocklistedResponse(req, res)`: custom your response when request is mark as `blocklisted`.
* `throttledResponse(req, res)`: custom your response when request is mark as `throttled`.
* `normalResponse(req, res, next)`: custom your response when request not in above situation.
* `errorResponse(req, res, next, error)`: custom your response when exception raise during check request phase.
* `store`: check [Custom your store](https://github.com/ocowchun/express-attack#custom-your-store) for detail.


## License
MIT