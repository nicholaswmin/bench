import { styleText as style } from 'node:util'
import utils from './utils.js'

const performanceEntryViews = {
  'connect': (entry, ctx, table) => {
    return {
      type: style(['blue'], 'connect'),
      name: 'connect',
      value: utils.toMs(entry.duration),
      detail: utils.toDetail(entry.detail)
    }
  },

  'net': (entry, ctx, table) => {
    return {
      type: style(['blue'], 'net'),
      name: 'net',
      value: utils.toMs(entry.duration),
      detail: utils.toDetail({
        host: entry.detail.host, port: entry.detail.port
      })
    }
  },

  'dns': (entry, ctx, table) => {
    return {
      type: style(['blue'], 'dns'),
      name: 'dns',
      value: utils.toMs(entry.duration),
      detail: utils.toDetail({ hostname: entry.detail.hostname })
    }
  },

  'function': (entry, ctx, table) => {
    return {
      type: 'function',
      name: entry.name.replace('bound', ''),
      value: utils.toMs(entry.duration),
      detail: '--'
    }
  },

  'gc': (entry, ctx, table) => {
    return {
      type: 'gc',
      name: 'gc',
      value: utils.toMs(entry.duration),
      detail: utils.toDetail(entry.detail)
    }
  },

  'mark': (entry, ctx, table) => {
    const value = entry.detail?.value || ' -- '
    const unit = entry.detail?.unit?.trim() || ''

    return {
      type:  style(['cyan'], 'mark'),
      name:  style(['cyan'], entry.name),
      value: style(['cyan'], value + ' ' + unit),
      detail: utils.toDetail(entry.detail)
    }
  },

  'measure': (entry, ctx, table) => {
    return {
      type:  style(['blue'], 'measure'),
      name:  style(['blue'], entry.name),
      value: style(['blue'], utils.toMs(entry.duration)),
      detail: utils.toDetail(entry.detail)
    }
  }
}

export default performanceEntryViews
