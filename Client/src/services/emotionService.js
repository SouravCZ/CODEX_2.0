import { api } from './api'

const REPORTS_KEY = 'drift_reports'
const NARRATIVES_KEY = 'drift_report_narratives'

function toFormData(fields) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) form.append(key, value)
  }
  return form
}

function readReports() {
  const raw = localStorage.getItem(REPORTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeReports(reports) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
}

export async function runCheckin({ videoBlob, journalText } = {}) {
  const video = new File([videoBlob], 'checkin.webm', { type: videoBlob?.type || 'video/webm' })
  const form = toFormData({ video, journal_text: journalText })
  const data = await api.post('/analysis/checkin', form)

  const reports = readReports().filter((r) => r.checkin_id !== data.checkin_id)
  reports.unshift({ checkin_id: data.checkin_id, saved_at: new Date().toISOString(), data })
  writeReports(reports)

  return data
}

export async function verify({ videoBlob, checkinId } = {}) {
  const video = new File([videoBlob], 'verify.webm', { type: videoBlob?.type || 'video/webm' })
  const form = toFormData({ video, checkin_id: checkinId })
  return api.post('/analysis/verify', form)
}

export function saveReport(data) {
  const reports = readReports().filter((r) => r.checkin_id !== data.checkin_id)
  reports.unshift({ checkin_id: data.checkin_id, saved_at: new Date().toISOString(), data })
  writeReports(reports)
}

export function getReport(checkinId) {
  const report = readReports().find((r) => r.checkin_id === checkinId)
  return report ? report.data : null
}

export function getReportMeta(checkinId) {
  return readReports().find((r) => r.checkin_id === checkinId) || null
}

export function listReports() {
  return readReports()
}

export function clearReports() {
  localStorage.removeItem(REPORTS_KEY)
}

function readNarratives() {
  const raw = localStorage.getItem(NARRATIVES_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeNarratives(narratives) {
  localStorage.setItem(NARRATIVES_KEY, JSON.stringify(narratives))
}

export function getCachedNarrative(checkinId) {
  return readNarratives()[checkinId] || null
}

export function cacheNarrative(checkinId, narrative) {
  const narratives = readNarratives()
  narratives[checkinId] = narrative
  writeNarratives(narratives)
}

export async function generateReport(checkinId, report) {
  const narrative = await api.post('/reports/generate', report)
  cacheNarrative(checkinId, narrative)
  return narrative
}

export async function generateInsight() {
  return api.post('/insights/generate')
}

export async function getLatestInsight() {
  return api.get('/insights/latest')
}

export async function getTrend() {
  return api.get('/insights/trend')
}

export default {
  runCheckin,
  verify,
  saveReport,
  getReport,
  getReportMeta,
  listReports,
  clearReports,
  generateInsight,
  getLatestInsight,
  getTrend,
  getCachedNarrative,
  cacheNarrative,
  generateReport,
}
