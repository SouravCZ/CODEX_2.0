import { useEffect, useState } from 'react'
import { getTrend } from '../services/emotionService'

const W = 600
const H = 220
const PAD = 14

function range(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v))
  if (!nums.length) return { min: 0, max: 1 }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return min === max ? { min, max: min + 1 } : { min, max }
}

function toY(value, { min, max }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return H - PAD - pct * (H - 2 * PAD)
}

function buildPath(points) {
  let path = ''
  let started = false
  points.forEach((p) => {
    if (p === null) {
      started = false
      return
    }
    if (!started) {
      path += `M ${p.x} ${p.y}`
      started = true
    } else {
      path += ` L ${p.x} ${p.y}`
    }
  })
  return path
}

function shortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr.slice(5)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TrendChart({ data, height = 250 }) {
  const [internal, setInternal] = useState(null)
  const [loaded, setLoaded] = useState(Boolean(data))

  useEffect(() => {
    if (data) {
      return
    }
    let active = true
    getTrend()
      .then((t) => active && setInternal(t))
      .catch(() => {})
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [data])

  const trend = data || internal
  const ready = Boolean(data) || loaded

  if (!ready) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: height }}>
        <p className="font-label-sm text-[#efe4ae]/50">Loading trend…</p>
      </div>
    )
  }

  const dates = trend?.dates || []
  const sentiment = trend?.sentiment_scores || []
  const drift = trend?.drift_scores || []

  if (!dates.length) {
    return (
      <div className="flex items-center justify-center text-center" style={{ minHeight: height }}>
        <p className="font-body-md text-[#efe4ae]/60 max-w-xs">
          No trend data yet. Complete a check-in or write a journal entry to start your curve.
        </p>
      </div>
    )
  }

  const n = dates.length
  const xs = dates.map((_, i) => (n === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (n - 1)))
  const sentRange = range(sentiment)
  const driftRange = range(drift)

  const sentPoints = sentiment.map((v, i) =>
    typeof v === 'number' && !Number.isNaN(v) ? { x: xs[i], y: toY(v, sentRange) } : null
  )
  const driftPoints = drift.map((v, i) =>
    typeof v === 'number' && !Number.isNaN(v) ? { x: xs[i], y: toY(v, driftRange) } : null
  )

  const xLabels = n <= 4 ? dates : [dates[0], dates[Math.floor(n / 2)], dates[n - 1]]

  return (
    <div className="w-full relative" style={{ minHeight: height }}>
      <svg
        className="w-full h-auto"
        viewBox={`0 0 ${W} ${H + 24}`}
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + f * (H - 2 * PAD)}
            y2={PAD + f * (H - 2 * PAD)}
            stroke="#efe4ae"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
        ))}
        <path d={buildPath(sentPoints)} fill="none" stroke="#efe4ae" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={buildPath(driftPoints)} fill="none" stroke="#ffb4ab" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
        {sentPoints.map((p, i) =>
          p ? (
            <circle key={`s${i}`} cx={p.x} cy={p.y} r="3" fill="#efe4ae">
              <title>{`${dates[i]}: ${sentiment[i]}`}</title>
            </circle>
          ) : null
        )}
        {driftPoints.map((p, i) =>
          p ? (
            <circle key={`d${i}`} cx={p.x} cy={p.y} r="2.5" fill="#ffb4ab" opacity="0.9">
              <title>{`${dates[i]}: drift ${drift[i]}`}</title>
            </circle>
          ) : null
        )}
      </svg>

      <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-label-sm text-[#efe4ae]/50">
        <span>100</span>
        <span>50</span>
        <span>0</span>
      </div>

      <div className="flex justify-between w-full mt-2 pl-8 text-label-sm text-[#efe4ae]/50">
        {xLabels.map((d) => (
          <span key={d}>{shortDate(d)}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 pl-8 text-label-sm text-[#efe4ae]/50">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-[#efe4ae] inline-block"></span> Sentiment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-error inline-block"></span> Drift
        </span>
      </div>
    </div>
  )
}

export default TrendChart
