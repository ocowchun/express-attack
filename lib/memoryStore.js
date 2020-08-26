function Heap() {
  this.array = []
  this.insert = function(expireAt, key) {
    this.array.push({ expireAt, key })
    let index = this.array.length - 1
    let parentIndex = this.getParentIndex(index)
    while (parentIndex !== null && this.array[parentIndex].expireAt > expireAt) {
      this.swap(index, parentIndex)
      index = parentIndex
      parentIndex = this.getParentIndex(index)
    }
  }

  this.extract = function() {
    const currentLength = this.array.length
    if (currentLength === 0) {
      return null
    } else if (currentLength === 1) {
      return this.array.pop()
    } else {
      const oldRoot = this.array[0]
      this.array[0] = this.array.pop()
      let index = 0
      let childrenIndices = this.getChildrenIndices(index)
      const g = childrenIndices.find((i) => this.array[index].expireAt > this.array[i].expireAt)
      while (
        childrenIndices.find((i) => this.array[index].expireAt > this.array[i].expireAt) !==
        undefined
      ) {
        const newIndex = childrenIndices.sort()[0]
        this.swap(newIndex, index)
        index = newIndex
        childrenIndices = this.getChildrenIndices(index)
      }
      return oldRoot
    }
  }

  this.root = function() {
    return this.array[0]
  }

  this.getParentIndex = function(index) {
    if (index > 0) {
      return Math.floor((index - 1) / 2)
    } else {
      return null
    }
  }

  this.swap = function(index1, index2) {
    const tmp = this.array[index1]
    this.array[index1] = this.array[index2]
    this.array[index2] = tmp
  }

  this.getChildrenIndices = function(index) {
    const currentLength = this.array.length
    return [1, 2].reduce((memo, i) => {
      if (index * 2 + i < currentLength) {
        return memo.concat([i + index])
      } else {
        return memo
      }
    }, [])
  }
}

function generateMemoryStore({ gcInterval = 300 }) {
  const memoryStore = { store: {} }
  memoryStore.heap = new Heap()
  memoryStore.get = async (key) => {
    const data = memoryStore.store[key]
    if (data && data.timestamp) {
      return data.timestamp
    } else {
      return undefined
    }
  }

  memoryStore.set = async (key, timestamp, period) => {
    const store = memoryStore.store
    const heap = memoryStore.heap
    const periodMs = period * 1000
    const expireAt = new Date().getTime() + period
    heap.insert(expireAt, key)
    store[key] = { timestamp, expireAt }
  }
  setInterval(function() {
    const heap = memoryStore.heap
    const store = memoryStore.store
    const currentTimestamp = new Date().getTime()
    while (heap.root() !== undefined && heap.root().expireAt <= currentTimestamp) {
      const { expireAt, key } = heap.extract()
      if (store[key] && store[key].expireAt <= currentTimestamp) {
        delete store[key]
      }
    }
  }, gcInterval * 1000)
  return memoryStore
}

module.exports = generateMemoryStore
