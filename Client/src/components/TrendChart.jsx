import { useEffect, useRef, useState } from 'react'
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

function toX(i, n) {
  return n === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (n - 1)
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

function smoothPath(points) {
  const pts = points.filter((p) => p !== null)
  if (!pts.length) return ''
  if (pts.length < 3) return buildPath(points)
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function shortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr.slice(5)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function movingAverage(values, window = 3) {
  return values.map((v, i) => {
    if (typeof v !== 'number' || Number.isNaN(v)) return null
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1).filter((x) => typeof x === 'number')
    if (!slice.length) return null
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

const METRIC_CONFIG = {
  'Wellness Score': { key: 'sentiment_scores', label: 'Wellness', color: '#efe4ae' },
  'Masking Level': { key: 'drift_scores', label: 'Masking', color: '#e6bcbd' },
  'Energy Baseline': { key: 'baseline_scores', label: 'Energy baseline', color: '#b3cdbc' },
}

function TrendChart({ data, metric = 'Wellness Score', height = 250 }) {
  const [internal, setInternal] = useState(null)
  const [loaded, setLoaded] = useState(Boolean(data))
  const [hoverIndex, setHoverIndex] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (data) return
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

  function onContainerMove(e) {
    const el = containerRef.current
    if (!el || !ready) return
    const rect = el.getBoundingClientRect()
    const dates = trend?.dates || []
    if (!dates.length) return
    const n = dates.length
    const rel = (e.clientX - rect.left) / rect.width
    const idx = Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1))))
    setHoverIndex(idx)
  }

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
  const baseline = movingAverage(sentiment)
  const baselineScores = baseline.map((v) => (v === null ? null : v))

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
  const activeConfig = METRIC_CONFIG[metric] || METRIC_CONFIG['Wellness Score']

  const series = {
    sentiment_scores: sentiment,
    drift_scores: drift,
    baseline_scores: baselineScores,
  }

  const primaryValues = series[activeConfig.key] || sentiment
  const secondaryValues = activeConfig.key === 'sentiment_scores' ? drift : sentiment

  const xs = dates.map((_, i) => toX(i, n))
  const primaryRange = range(primaryValues)
  const secondaryRange = range(secondaryValues)

  const primaryPoints = primaryValues.map((v, i) =>
    typeof v === 'number' && !Number.isNaN(v) ? { x: xs[i], y: toY(v, primaryRange) } : null
  )
  const secondaryPoints = secondaryValues.map((v, i) =>
    typeof v === 'number' && !Number.isNaN(v) ? { x: xs[i], y: toY(v, secondaryRange) } : null
  )

  const primaryPath = smoothPath(primaryPoints)
  const secondaryPath = smoothPath(secondaryPoints)
  const primaryColor = activeConfig.color
  const secondaryColor = activeConfig.key === 'sentiment_scores' ? '#e6bcbd' : '#efe4ae'

  const areaPath = primaryPoints.length
    ? `${primaryPath} L ${primaryPoints.filter(Boolean).at(-1).x} ${H - PAD} L ${
        primaryPoints.filter(Boolean)[0].x
      } ${H - PAD} Z`
    : ''

  const xLabels = n <= 4 ? dates : [dates[0], dates[Math.floor(n / 2)], dates[n - 1]]

  const hover = hoverIndex !== null ? hoverIndex : null
  const hoverPoint = hover !== null && primaryPoints[hover] ? primaryPoints[hover] : null

  return (
    <div
      ref={containerRef}
      className="w-full relative select-none"
      style={{ minHeight: height, touchAction: 'pan-y' }}
      onMouseMove={onContainerMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg className="w-full h-auto" viewBox={`0 0 ${W} ${H + 24}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>

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

        {areaPath && <path d={areaPath} fill="url(#trend-area)" />}

        <path
          d={secondaryPath}
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={activeConfig.key === 'sentiment_scores' ? 0.7 : 0.35}
        />
        <path
          d={primaryPath}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {secondaryPoints.map((p, i) =>
          p ? (
            <circle
              key={`s${i}`}
              cx={p.x}
              cy={p.y}
              r={hover === i ? 4 : 2.5}
              fill={secondaryColor}
              opacity={hover === i ? 1 : 0.9}
            >
              <title>{`${dates[i]} · ${secondaryColor === '#e6bcbd' ? 'masking' : 'wellness'} ${secondaryValues[i]}`}</title>
            </circle>
          ) : null
        )}
        {primaryPoints.map((p, i) =>
          p ? (
            <circle
              key={`p${i}`}
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5 : 3}
              fill={primaryColor}
              stroke="#12281d"
              strokeWidth="1.5"
              style={{ transition: 'r 0.15s ease' }}
            >
              <title>{`${dates[i]} · ${activeConfig.label} ${primaryValues[i]}`}</title>
            </circle>
          ) : null
        )}

        {hoverPoint && hover !== null && (
          <g>
            <line
              x1={hoverPoint.x}
              x2={hoverPoint.x}
              y1={PAD}
              y2={H - PAD}
              stroke="#efe4ae"
              strokeOpacity="0.4"
              strokeDasharray="3 3"
            />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="12" fill={primaryColor} opacity="0.18" />
          </g>
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

      {hover !== null && hoverPoint && (
        <div
          className="absolute top-0 z-10 -translate-x-1/2 pointer-events-none whitespace-nowrap rounded-xl bg-[#08160F]/95 backdrop-blur-md border border-[#efe4ae]/20 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          style={{
            left: `${(hoverPoint.x / W) * 100}%`,
          }}
        >
          <p className="font-label-sm text-[#efe4ae]/70 mb-1">{shortDate(dates[hover])}</p>
          <p className="font-label-sm text-[#efe4ae] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: primaryColor }}></span>
            {activeConfig.label}: {typeof primaryValues[hover] === 'number' ? primaryValues[hover].toFixed(2) : '—'}
          </p>
          <p className="font-label-sm text-[#efe4ae]/70 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: secondaryColor }}></span>
            {activeConfig.key === 'sentiment_scores' ? 'Masking' : 'Wellness'}:{' '}
            {typeof secondaryValues[hover] === 'number' ? secondaryValues[hover].toFixed(2) : '—'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-3 pl-8 text-label-sm text-[#efe4ae]/50">
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-0.5 inline-block rounded-full"
            style={{ backgroundColor: primaryColor }}
          ></span>{' '}
          {activeConfig.label}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-0.5 inline-block rounded-full"
            style={{ backgroundColor: secondaryColor }}
          ></span>{' '}
          {activeConfig.key === 'sentiment_scores' ? 'Masking' : 'Wellness'}
        </span>
      </div>
    </div>
  )
}

export default TrendChart