import { createHistogram, monitorEventLoopDelay } from 'node:perf_hooks'
import { styleText as style } from 'node:util'
import utils from './utils.js'

const hStyle = ['cyan', 'bold']

const sortHistogram = (a, b) => b.histogram.mean - a.histogram.mean

const addRowsForHeader = (table, { name }) => {
  table.addRows(computeHistogramHeaderRows({ name: style(hStyle, name) }))
}

const addRowsForTasks = (table, histograms) => {
  if (!histograms.length)
    return

  histograms.sort(sortHistogram)
    .forEach(({ histogram, name }) =>
      table.addRow(computeHistogramRow(histogram, utils.nsToMs, { name })))
}

const addRowsForMarks = (table, entries) => {
  const histograms = computeHistogramsFromMarksWithValue(entries)

  if (!histograms.length)
    return

  histograms.sort(sortHistogram)
    .forEach(({ histogram, name, unit }) => {
      const mapFn = txt => txt ? (unit ? txt + ' ' + unit : txt + '') : 'n/a'
      table.addRow(computeHistogramRow(histogram, mapFn, { name, unit }))
    })
}

const addRowsForMeasures = (table, entries) => {
  const histograms = computeHistogramsFromMeasures(entries)

  if (!histograms.length)
    return

  histograms.sort(sortHistogram)
    .forEach(({ name, histogram }) =>
      table.addRow(computeHistogramRow(histogram, utils.toMs, { name })))
}

const addRowsForEntryType = (table, entries, { entryType }) => {
  const histogram = computeHistogramForEntryType(entries, { entryType })

  if (!histogram)
    return

  table.addRow(computeHistogramRow(histogram, utils.nsToMs, { name: entryType }))
}

const addRowsForHistogram = (table, histogram, { name }) => {
  table.addRow(computeHistogramRow(histogram, utils.nsToMs, { name }))
}

const addRowsForUsages = (table, usages, { name }) => {
  const histogram = createHistogram()
  const _entries = usages
    .forEach(usage => histogram.record(Math.ceil(usage.heapUsed)))

  const mapFn = bytes => utils.round((bytes / 1000 / 1000)) + ' mb'

  table.addRow(computeHistogramRow(histogram, mapFn, { name }))
}

const computeHistogramForEntryType = (entries, { entryType }) => {
  const histogram = createHistogram()

  entries
    .filter(entry => entry.entryType === entryType && entry.duration > 0)
    .forEach(entry => histogram.record(Math.ceil(entry.duration)))

  return histogram
}

const computeHistogramsFromMarksWithValue = entries => {
  const marksWithValue = entries.flat()
    .filter(entry => entry.entryType === 'mark' && entry.detail?.value)
    .map(entry => ({ ...entry, value: entry.detail.value }))

  return computeHistogramsFromEntries(marksWithValue)
}

const computeHistogramsFromMeasures = entries => {
    const measures = entries
      .filter(entry => entry.entryType === 'measure')
      .map(entry => ({ ...entry, value: entry.duration }))

    return computeHistogramsFromEntries(measures)
  }

const computeHistogramsFromEntries = entries => {
    const grouped = Object.groupBy(entries, ({ name }) => name)

    return Object.keys(grouped).map(key => {
      const histogram = createHistogram()

      grouped[key].forEach(entry =>
        histogram.record(Math.ceil(entry.value)))

      return {
        name: key,
        unit: grouped[key][0]?.detail?.unit,
        histogram
      }
    })
  }

const computeHistogramHeaderRows = ({ name = 'Untitled' } = {}) => {
  const separator = computeHistogramSeparator()

  return [ separator, { name: name.trim() }, separator ]
}

const computeHistogramSeparator = () => {
  const columns = computeHistogramColumns()

  return columns.reduce((acc, column) => {
    acc[column.name] = acc[column.name] ? acc[column.name] : ''

    return acc
  }, {})
}

const computeHistogramColumns = () => ([
  { name: 'name', alignment: 'right' },
  { name: 'count', alignment: 'right' },
  { name: 'min', alignment: 'right' },
  { name: 'max', alignment: 'right' },
  { name: 'mean', alignment: 'right' },
  { name: '50_%', alignment: 'right' },
  { name: '75_%', alignment: 'right' },
  { name: '100_%', alignment: 'right' },
  { name: 'deviation', alignment: 'right' }
])

const computeHistogramRow = (histogram, fn, { name = '' } = {}) => {
    return {
      'name': name.trim(),
      'count': String(histogram.count),
      'min': fn(histogram.min),
      'max': style('yellow', fn(histogram.max)),
      'mean': style('green', fn(histogram.mean)),
      '50_%': fn(histogram.percentiles.get(50)),
      '75_%': fn(histogram.percentiles.get(75)),
      '100_%': fn(histogram.percentiles.get(100)),
      'deviation': fn(histogram.stddev)
    }
  }


export default {
  addRowsForTasks,
  addRowsForEntryType,
  addRowsForMarks,
  addRowsForMeasures,
  addRowsForUsages,
  addRowsForHistogram,

  addRowsForHeader,
  computeHistogramColumns
}
