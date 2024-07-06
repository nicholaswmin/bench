import { randomInt } from 'node:crypto'

const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const toMB = bytes => round(bytes / 1000 / 1000)
const toMs = num => num ? round(num) + ' ms' : 'n/a'
const nsToMs = ns => isNaN(ns) ? 'n/a' : round(ns / 1000000) + ' ms'
const randomID = (prefix = 'uid_') => prefix + randomInt(1000000, 9999999)
const toDetail = detail => detail ? Object.keys(detail)
  .map(key => `${key}=${detail[key]}`).join(' ') : 'n/a'

export default { round,  toMB,  toMs, nsToMs, randomID, toDetail }
