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