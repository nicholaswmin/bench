import plot from './ascii-chart.js'

class CyclePlot {
  constructor({ entries = [], name = 'Plot' }) {
    this.name = name
    this.entries = entries
    this.colors = [92, 33, 34, 35, 36, 37].map(c => '\u001b[' + c + 'm')
    this.cycles = {}
    this.plot = null
    this.disabled = ['test'].includes(process.env.NODE_ENV)
  }

  get() {
    return this.plot
  }

  draw(i) {
    if (this.disabled)
      return this

    console.clear()
    console.log(this.plot)

    return this
  }

  async update(i) {
    const toIntDuration = entry => parseInt(entry.duration)
    const toTasknameTop = (a, b) => (b === this.name) - (a === this.name)
    const isPositive = value => value > 0
    const toLabel = (key, i) => {
      const taskLabel = i => `- ${!i ? 'main task' : 'fn:'}`
      const funcLabel = (key, i) => i ? key.replaceAll('bound ', '') : ''

      return `${taskLabel(i)}${funcLabel(key, i)}`
    }

    await this.#onEventLoopEnd()
    this.#updatePaddedCycles(i)

    const keys = Object.keys(this.cycles).sort(toTasknameTop)
    const durations = keys.map(key => this.cycles[key].map(toIntDuration))
    const lineLabels = keys.map(toLabel)

    if (!durations.flat().length)
      return this

    this.plot = plot(durations, {
      width: (process.stdout.columns || 200) / 2,
      height: (process.stdout.rows || 25) / 2.5,
      title: `task: "${this.name}"`,
      colors: keys.map((key, i) => this.colors[i % this.colors.length]),
      lineLabels: lineLabels,
      yLabel: 'durations (ms)',
      xLabel: 'cycles',
      time: 'millis'
    })

    return this
  }

  #updatePaddedCycles(i) {
    const updatedCycles = this.#getLastFunctionEntries(this.entries.flat())
      .reduce((cycles, entry) => {
        const cycle = cycles[entry.name]
        const lastEntry = cycle ? cycle.at(-1) : null
        const noNewEntry = lastEntry && lastEntry.startTime === entry.startTime
        const paddingEntry = lastEntry ? ({ ...lastEntry, duration: 0 }) : null

        return cycle ? {
          ...cycles,
          [entry.name]: [ ...cycle, noNewEntry ? paddingEntry : entry ]
        } : { ...cycles, [entry.name]: [ entry ] }
      }, this.cycles)

    this.cycles = this.#padCyclesToMaxLength(updatedCycles)

    return this
  }

  #padCyclesToMaxLength(cycles) {
    const cycleLengths = Object.values(cycles).map(cycle => cycle.length)
    const maxCycleLength = Math.max(...cycleLengths)

    return Object.keys(cycles).reduce((cycles, key) => {
      return {
        ...cycles,
        [key]: Array.from({ length: maxCycleLength - cycles[key].length })
         .fill({ startTime: 0, duration: 0 })
         .concat(cycles[key])
      }
    }, cycles)
  }

  #getLastFunctionEntries(entries) {
    return entries
      .filter(entry => ['function'].includes(entry.entryType))
      .reduce((acc, entry, i, arr) => {
        const name = entry.name === 'fn' ?
          entry.detail?.[0]?.taskname :
          entry.name

        acc[name] = { ...entry, name }

        return i === arr.length - 1 ? Object.values(acc) : acc
      }, [])
  }

  #onEventLoopEnd() {
    return new Promise(res => setImmediate(res))
  }
}

export default CyclePlot
