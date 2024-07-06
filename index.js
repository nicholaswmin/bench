import { monitorEventLoopDelay } from 'node:perf_hooks'
import { styleText as style, inspect } from 'node:util'
import { Table, printTable } from 'console-table-printer'

import histograms from './src/histograms.js'
import timeline from './src/timeline.js'
import errors from './src/errors.js'
import utils from './src/utils.js'
import Task from './src/task.js'

class PerformanceRunner {
  #state

  constructor() {
    this.tasks = []
    this.entries = []
    this.loopHs = new monitorEventLoopDelay({ resolution: 10 })

    this.#state = 'ready'
  }

  async run(taskData = []) {
    this.#validateTasks(taskData)

    this.#throwIfEnded()
    this.#throwIfRunning()

    this.tasks = taskData.map(task => new Task(task))
    this.#transitionState('running')
    this.loopHs.enable()

    for (const task of this.tasks)
      this.entries = this.entries.concat(await task.run())

    return this.#end()
  }

  toTimeline() {
    this.#throwIfNotEnded()

    const table = new Table({
      title: 'timeline',
      columns: [
        { name: 'type', alignment: 'right' },
        { name: 'name', alignment: 'right' },
        { name: 'value', alignment: 'left' },
        { name: 'detail', alignment: 'left' }
      ]
    })

    table.addRows(timeline.computeHeaderRows({
      column: 'type',
      columns: ['type', 'name', 'value', 'detail'],
      value: style(['white', 'bold', 'underline'], 'Startup')
    }))

    this.entries.forEach(entry => {
      const isTask = entry.detail && entry.detail.length &&
        Object.hasOwn(entry.detail[0], 'taskname')

      return isTask ?
        timeline.addRowForCycle(table, entry) :
        timeline.addRowForEntry(table, entry)
    })

    process.env.NODE_ENV === 'test' ?
      null : table.printTable()

    return table
  }

  toHistograms() {
    this.#throwIfNotEnded()

    const table = new Table({
      title: 'histograms',
      columns: histograms.computeHistogramColumns()
    })

    histograms.addRowsForHeader(table, { name: 'tasks' })
    histograms.addRowsForTasks(table, this.tasks)

    histograms.addRowsForHeader(table, { name: 'entry' })
    histograms.addRowsForMarks(table, this.entries)

    histograms.addRowsForHeader(table, { name: 'measures' })
    histograms.addRowsForMeasures(table, this.entries)

    histograms.addRowsForHeader(table, { name: 'entry types' })
    histograms.addRowsForEntryType(table, this.entries, { entryType: 'gc' })
    histograms.addRowsForEntryType(table, this.entries, { entryType: 'dns' })
    histograms.addRowsForEntryType(table, this.entries, { entryType: 'net' })

    histograms.addRowsForHeader(table, { name: 'vitals' })

    histograms.addRowsForHistogram(table, this.loopHs, { name: 'loop latency' })

    process.env.NODE_ENV === 'test' ?
      null : table.printTable()

    return table
  }

  toPlots() {
    this.#throwIfNotEnded()

    this.tasks.forEach(task => console.log(task.plot.get(), '\n'))

    return this
  }

  toEntries() {
    this.#throwIfNotEnded()

    return this.tasks.map(task => {
      return {
        name: task.name,
        entries: task.entries.flat()
      }
    })
  }

  async #end() {
    this.loopHs.disable()
    this.#transitionState('ended')
  }

  #transitionState(state) {
    if (!['running', 'ended'].includes(state))
      throw new errors.InvalidStateError(state)

    this.#state = state

    return this
  }

  #validateTasks(tasks) {
    if (!Array.isArray(tasks) || !tasks.length)
      throw new Error(`Expected tasks to be an Array with length`)

    tasks.forEach((task, i) => {
      if (!task || typeof tasks !== 'object')
        throw new Error(`Expected task ${i} to be an object`)

      if (!Object.hasOwn(task, 'name') || task.name.length < 1)
        throw new Error(`Expected task ${i} to have a valid name property `)

      if (!Object.hasOwn(task, 'fn') || typeof task.fn !== 'function')
        throw new Error(`Expected task ${i} to have a valid fn property `)

      if (!Object.hasOwn(task, 'cycles') || task.cycles < 1)
        throw new Error(`Expected task.${i}.cycles to be a positive integer`)
    })

    return tasks
  }

  #throwIfNotEnded() {
    if (this.#state !== 'ended')
      throw new errors.RunNotEndedError()
  }

  #throwIfEnded() {
    if (this.#state === 'ended')
      throw new errors.AlreadyEndedError()
  }

  #throwIfRunning() {
    if (this.#state === 'running')
      throw new errors.StillRunningError()
  }
}

export { PerformanceRunner }
