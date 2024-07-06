import { createHistogram } from 'node:perf_hooks'

import CyclePlot from './cycle-plot/index.js'
import utils from './utils.js'

class Task {
  constructor({ id = utils.randomID(), name, cycles, fn }) {
    this.id = id
    this.name = this.#validateStringWithLength(name, 'name')
    this.cycles = this.#validatePositiveInt(cycles, 'cycles')

    this.entries = []

    this.plot = new CyclePlot({ entries: this.entries, name })
    this.observer = new PerformanceObserver(this.#observerCB.bind(this))
    this.entryTypes = PerformanceObserver.supportedEntryTypes

    this.histogram = createHistogram()
    this.timerifiedFn = performance.timerify(
      this.#validateFn(fn, 'fn'),
      { histogram: this.histogram }
    )
  }

  async run(i = null) {
    i = i === null ? (this.#start() || 0) : i

    await this.timerifiedFn({ cycle: i + 1, taskname: this.name })

    await this.plot.update(i).then(plot => plot.draw(i))

    return i === this.cycles - 1 ? this.#end() : this.run(++i)
  }

  #start() {
    this.observer.observe({ entryTypes: this.entryTypes })
  }

  async #end() {
    await this.#onEventLoopEnd()

    this.observer.disconnect()

    this.#addEntries(this.observer.takeRecords())

    return this.entries.flat()
  }

  #observerCB(items) {
    this.#addEntries(items.getEntries())
  }

  #addEntries(entries) {
    this.entries.push(entries.map(entry => entry.toJSON()))
  }

  #onEventLoopEnd() {
    return new Promise(res => setImmediate(res))
  }

  #validateStringWithLength(str, name) {
    if (typeof str !== 'string' || !str.length)
      throw new Error(`Expected ${name} to be a string with length`)

    return str
  }

  #validatePositiveInt(num, name) {
    if (isNaN(num) || num < 1)
      throw new Error(`Expected ${name} to be a positive integer`)

    return num
  }

  #validateFn(func, name) {
    if (typeof func !== 'function')
      throw new Error(`Expected ${name} to be a function`)

    return func
  }
}

export default Task
