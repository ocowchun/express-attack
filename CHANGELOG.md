## 0.5.2 (2020-09-24)
- Upgrade packages #2, #4, #5, #6

## 0.5.1 (2020-08-26)
- Fix throttle mechanism, it should try all throttle function until:
  - A `throttle function` return `true` or `limited` equal `true`
  - All `throttle function` passed

## 0.5.0 (2020-08-25)
- **BREAKING CHANGE** Apply GCRA as new throttle strategy, you can read more about GCRA from [here](https://brandur.org/rate-limiting) or [here](https://github.com/Losant/redis-gcra)

## 0.4.1 (2020-05-15)
- Adjust Node.js version requirement

## 0.4.0 (2020-04-29)
- Add `error` to `errorResponse`

## 0.3.3 (2019-09-20)
- Upgrade jest to 24.9.0