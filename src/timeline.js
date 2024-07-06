import { styleText as style } from 'node:util'
import utils from './utils.js'

import performanceEntryViews from './performance-entry-views.js'

const toRowView = entry => performanceEntryViews[entry.entryType](entry)

const addRowForEntry = (table, entry) => {
  table.addRow(toRowView(entry))
}

const addRowForCycle = (table, entry) => {
  const { taskname, cycle } = entry.detail[0]

  cycle === 1 ? table.addRows(computeHeaderRows({
    columns: ['type', 'name', 'value'],
    column: 'type',
    value: style(['magenta', 'bold', 'underline'], `Task: ${taskname}`),
    detail: ''
  })) : table.addRow(computeSeparator(['type', 'name', 'value']))

  table.addRow({
    type: style(['white', 'bold', 'underline'], 'cycle'),
    name: style(['white', 'bold'], `${taskname} ${cycle}`),
    value: style(['green', 'bold', 'underline'], utils.toMs(entry.duration)),
    detail: ''
  })
}

const computeHeaderRows = ({ columns, column, value }) => {
  const separator = computeSeparator(columns)

  return [ separator, { [column]: value }, separator ]
}

const computeSeparator = (columns) => {
  return columns.reduce((acc, column) => {
    acc[column] = ''

    return acc
  }, {})
}

export default {
  addRowForCycle,
  addRowForEntry,
  computeHeaderRows,
  computeSeparator
}
