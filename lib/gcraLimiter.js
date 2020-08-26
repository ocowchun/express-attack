function GCRALimiter({ store, burst, emissionInterval, cost = 1 }) {
  const limit = async function(key) {
    const now = new Date().getTime()
    const increment = emissionInterval * cost
    const burstOffset = emissionInterval * burst

    let tat = await store.get(key)
    if (tat === undefined || tat === null) {
      tat = now
    }
    tat = Math.max(tat, now)

    const newTat = tat + increment
    const allowAt = newTat - burstOffset
    const diff = now - allowAt

    let remaining = Math.floor(diff / emissionInterval)
    if (remaining < 0) {
      remaining = Math.floor((now - (tat - burstOffset)) / emissionInterval)
      const resetIn = Math.ceil(tat - now)
      const retryIn = Math.ceil(diff * -1)
      return {
        remaining,
        resetIn,
        retryIn,
        limited: true,
      }
    } else {
      const resetIn = Math.ceil(newTat - now)
      await store.set(key, newTat, resetIn)

      return {
        remaining,
        resetIn,
        retryIn: 0,
        limited: false,
      }
    }
  }

  return { limit }
}

module.exports = GCRALimiter