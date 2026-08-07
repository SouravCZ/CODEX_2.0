import { useEffect, useState } from 'react'
import { generateInsight, getLatestInsight } from '../services/emotionService'

const STATUS_COLOR = {
  stable: '#b3cdbc',
  balanced: '#b3cdbc',
  drifting: '#efe4ae',
  elevated: '#d1c793',
  at_risk: '#ffb4ab',
}

function InsightsPanel({ insight, onGenerated, embedded = false }) {
  const [internal, setInternal] = useState(null)
  const [loaded, setLoaded] = useState(Boolean(insight))
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (insight) return
    let active = true
    getLatestInsight()
      .then((value) => active && setInternal(value))
      .catch(() => {})
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [insight])

  const data = insight || internal

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const value = await generateInsight()
      setInternal(value)
      if (onGenerated) onGenerated(value)
    } catch (err) {
      setError(err.message || 'Could not generate insight.')
    } finally {
      setGenerating(false)
    }
  }

  if (!data && !loaded) {
    return <p className="font-label-sm text-[#efe4ae]/50 text-center py-4">Loading insight…</p>
  }

  const status = data?.drift_status?.toLowerCase() || 'stable'
  const statusColor = STATUS_COLOR[status] || '#efe4ae'
  const score = typeof data?.drift_score === 'number' ? Math.round(data.drift_score) : null

  const content = (
    <>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-headline-md text-[#efe4ae] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#efe4ae]">psychology</span>
          Today&apos;s Insight
        </h3>
        <button
          className="w-9 h-9 rounded-full bg-[#12281d]/60 border border-[#efe4ae]/20 flex items-center justify-center text-[#efe4ae] hover:bg-[#efe4ae]/10 transition-colors disabled:opacity-50"
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          title="Generate insight"
        >
          <span className={`material-symbols-outlined text-[18px] ${generating ? 'animate-spin' : ''}`}>
            autorenew
          </span>
        </button>
      </div>

      {data ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full font-label-sm border flex items-center gap-1.5"
              style={{ color: statusColor, borderColor: `${statusColor}55`, background: `${statusColor}14` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }}></span>
              {data.drift_status}
            </span>
            {score !== null && (
              <span className="font-label-sm text-[#efe4ae]/50">score {score}</span>
            )}
          </div>
          <p className="font-body-md text-[#efe4ae]/80 leading-relaxed">{data.summary}</p>
          {data.recommendation && (
            <div className="bg-[#12281d]/40 rounded-xl p-4 border border-[#efe4ae]/10">
              <p className="font-label-sm text-[#efe4ae]/60 uppercase tracking-wider mb-1">Recommendation</p>
              <p className="font-body-md text-[#efe4ae]">{data.recommendation}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <p className="font-body-md text-[#efe4ae]/60">
            No insight yet. Generate one from your recent reflections.
          </p>
          <button
            className="bg-[#efe4ae] text-[#12281d] font-label-md rounded-full px-5 py-2.5 hover:bg-[#efe4ae]/90 transition-colors"
            type="button"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating…' : 'Generate Insight'}
          </button>
        </div>
      )}

      {error && (
        <p className="font-label-sm text-error mt-2" role="alert">
          {error}
        </p>
      )}
    </>
  )

  if (embedded) return content

  return <div className="glass-card rounded-[24px] p-6 backdrop-blur-md">{content}</div>
}

export default InsightsPanel
