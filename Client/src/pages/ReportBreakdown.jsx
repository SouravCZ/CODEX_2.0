import { useEffect, useState } from 'react'
import { getCachedNarrative, generateReport } from '../services/emotionService'

const defaultChannels = [
  {
    key: 'face',
    icon: 'sentiment_neutral',
    title: 'Face Analysis',
    tag: 'Micro-expressions',
    body: 'No facial insight available for this report.',
  },
  {
    key: 'voice',
    icon: 'graphic_eq',
    title: 'Voice Analysis',
    tag: 'Acoustic Profile',
    body: 'No vocal insight available for this report.',
  },
  {
    key: 'heartbeat',
    icon: 'monitor_heart',
    title: 'Heartbeat Analysis',
    tag: 'Cardiovascular Data',
    body: 'No cardiovascular insight available for this report.',
  },
  {
    key: 'words',
    icon: 'history_edu',
    title: 'Word Analysis',
    tag: 'Semantic Sentiment',
    body: 'No written insight available for this report.',
  },
]

const MASK_LEVEL_LABEL = {
  none: 'Balanced',
  mild: 'Mild Masking',
  significant: 'Masked Stress',
  severe: 'Masked Stress',
}

const narrativeRequests = new Map()

function SkeletonBar({ className = '' }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />
}

function ReportBreakdown({
  report,
  checkinId,
  savedAt,
  onStartCheckIn,
  onDashboard,
  onBreathing,
  onReflect,
}) {
  const [narrative, setNarrative] = useState(() => (checkinId ? getCachedNarrative(checkinId) : null))
  const [loading, setLoading] = useState(narrative === null)

  useEffect(() => {
    if (!checkinId || narrative) return
    let cancelled = false
    let pending = narrativeRequests.get(checkinId)
    if (!pending) {
      pending = generateReport(checkinId, report)
      narrativeRequests.set(checkinId, pending)
    }
    pending
      .then((next) => {
        narrativeRequests.delete(checkinId)
        if (!cancelled) {
          setNarrative(next)
          setLoading(false)
        }
      })
      .catch(() => {
        narrativeRequests.delete(checkinId)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [checkinId, narrative, report])

  const dateLabel = savedAt
    ? new Date(savedAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : report?.created_at
      ? new Date(report.created_at).toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Most recent check-in'

  const index = report && typeof report.wellness_index === 'number' ? Math.round(report.wellness_index) : 45
  const stateLabel = MASK_LEVEL_LABEL[report?.masking_level] || (report?.aligned ? 'Balanced' : 'Masked Stress')

  const summary =
    narrative?.summary ||
    "Your physiological signals suggest internal stress that isn't being reflected in your outward expression. While your tone and word choice present a baseline of calm, your heart rate variability and micro-expressions indicate cognitive load and fatigue."

  const channels = defaultChannels.map((c) => ({
    ...c,
    body: narrative?.channels?.[c.key] || c.body,
  }))

  const divergenceText = (() => {
    const disagreements = Array.isArray(report?.disagreements) ? report.disagreements : []
    if (disagreements.length) {
      const top = disagreements[0]
      const pair = String(top.pair || '')
        .split(' vs ')
        .map((part) => {
          const mapped = { vitals: 'heartbeat', body: 'heartbeat' }[part.trim()]
          return mapped || part.trim()
        })
        .join(' vs ')
      const delta = typeof top.delta === 'number' ? ` (Δ ${top.delta.toFixed(2)})` : ''
      return `Greatest divergence: ${pair}${delta}`
    }
    return report?.masking_level && report.masking_level !== 'none'
      ? 'Channels diverged during the capture'
      : 'Channels stayed closely aligned during the capture'
  })()

  const somaticBody =
    narrative?.somatic_body ||
    'Your nervous system is holding tension that your conscious mind is trying to override. We recommend regulating your physical state before attempting heavy cognitive processing.'
  const prompt =
    narrative?.journal_prompt || "What am I protecting by saying I'm fine?"

  return (
    <div
      className="bg-primary-container text-on-surface min-h-screen flex flex-col font-body-md overflow-x-hidden relative"
      style={{ backgroundColor: '#12281d', color: '#e2e3e0' }}
    >
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          alt=""
          className="absolute -top-[10%] -left-[10%] w-1/2 max-w-2xl opacity-30 mix-blend-screen transform -rotate-12 blur-sm pointer-events-none"
          src="/report-left.png"
        />
        <img
          alt=""
          className="absolute -bottom-[10%] -right-[10%] w-1/2 max-w-2xl opacity-30 mix-blend-screen transform rotate-12 blur-sm pointer-events-none"
          src="/report-right.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#12281d]/50 to-[#12281d]/95"></div>
      </div>

      <main className="flex-grow w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto mt-8 mb-xl z-10 relative">
        <header className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div>
            <p className="font-label-md text-[#d1c793]/70 mb-2 tracking-widest uppercase">{dateLabel}</p>
            <h1 className="font-serif text-display-lg-mobile md:text-display-lg text-[#d1c793] mb-xs">
              Emotional Analysis Report
            </h1>
          </div>
          <div className="glass-card rounded-xl px-md py-sm flex items-center gap-sm">
            <div className="w-3 h-3 rounded-full bg-[#d1c793] shadow-[0_0_8px_rgba(239,228,174,0.6)]"></div>
            <div>
              <div className="font-label-sm text-on-surface-variant uppercase tracking-widest">Wellness Index</div>
              <div className="font-headline-md text-[#d1c793]">
                {index} - {stateLabel}
              </div>
            </div>
          </div>
        </header>

        <section className="glass-card rounded-[24px] p-md md:p-lg mb-lg">
          <h2 className="font-headline-md text-[#d1c793] mb-sm flex items-center gap-sm">
            <span className="material-symbols-outlined">psychology</span> Executive Summary
          </h2>
          {loading ? (
            <div className="space-y-2 max-w-3xl">
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-11/12" />
              <SkeletonBar className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="font-body-lg text-on-surface/90 max-w-3xl leading-relaxed">{summary}</p>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-lg">
          {channels.map((ch) => (
            <div
              key={ch.key}
              className="glass-card rounded-[24px] p-md flex flex-col h-full hover:bg-white/5 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-[#d1c793]/10 flex items-center justify-center mb-md text-[#d1c793]">
                <span className="material-symbols-outlined">{ch.icon}</span>
              </div>
              <h3 className="font-headline-md text-[#d1c793] mb-xs">{ch.title}</h3>
              <p className="font-label-sm text-[#d1c793]/60 uppercase tracking-widest mb-sm">{ch.tag}</p>
              {loading ? (
                <div className="space-y-2 flex-grow">
                  <SkeletonBar className="h-3 w-full" />
                  <SkeletonBar className="h-3 w-5/6" />
                  <SkeletonBar className="h-3 w-2/3" />
                </div>
              ) : (
                <p className="font-body-md text-on-surface/80 flex-grow">{ch.body}</p>
              )}
            </div>
          ))}
        </section>

        <section className="glass-card rounded-[24px] p-md md:p-lg mb-lg">
          <div className="flex justify-between items-center mb-md">
            <h2 className="font-headline-md text-[#d1c793] flex items-center gap-sm">
              <span className="material-symbols-outlined">timeline</span> Signal Alignment
            </h2>
            <div className="flex gap-sm">
              <span className="px-3 py-1 rounded-full bg-[#d1c793]/10 text-[#d1c793] font-label-sm">60s Capture</span>
            </div>
          </div>
          <div className="w-full h-64 bg-surface-container/50 rounded-xl border border-outline-variant/20 relative overflow-hidden flex flex-col justify-center px-md">
            <div className="w-full h-px bg-outline-variant/30 absolute top-1/2 -translate-y-1/2 left-0"></div>
            <div className="absolute top-1/4 left-10 right-10 h-10 border-b-2 border-[#d1c793]/40 rounded-[50%] blur-[1px]"></div>
            <div className="absolute bottom-1/4 left-10 right-10 h-12 border-t-2 border-primary/50 rounded-[100%] blur-[1px]"></div>
            <div className="absolute left-1/4 top-1/3 w-4 h-4 rounded-full bg-tertiary shadow-[0_0_12px_rgba(230,188,189,0.8)] animate-pulse"></div>
            <div className="absolute left-2/3 bottom-1/3 w-3 h-3 rounded-full bg-[#d1c793] shadow-[0_0_12px_rgba(209,199,147,0.8)] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <p className="text-center font-label-sm text-on-surface-variant absolute bottom-4 w-full left-0 uppercase tracking-widest">
              {divergenceText}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="glass-card rounded-[24px] p-md md:p-lg">
            <h3 className="font-headline-md text-[#d1c793] mb-sm flex items-center gap-sm">
              <span className="material-symbols-outlined">self_improvement</span> Somatic Priority
            </h3>
            {loading ? (
              <div className="space-y-2 mb-md">
                <SkeletonBar className="h-3 w-full" />
                <SkeletonBar className="h-3 w-10/12" />
                <SkeletonBar className="h-3 w-8/12" />
              </div>
            ) : (
              <p className="font-body-md text-on-surface/80 mb-md">{somaticBody}</p>
            )}
            <button
              className="bg-[#d1c793] text-on-secondary px-lg py-3 rounded-full font-label-md hover:bg-secondary-fixed-dim transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 w-full md:w-auto"
              type="button"
              onClick={onBreathing}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                air
              </span>
              Start Vagus Nerve Breathing
            </button>
          </div>
          <div className="glass-card rounded-[24px] p-md md:p-lg">
            <h3 className="font-headline-md text-[#d1c793] mb-sm flex items-center gap-sm">
              <span className="material-symbols-outlined">edit_note</span> Journal Prompt
            </h3>
            {loading ? (
              <div className="space-y-2 mb-md">
                <SkeletonBar className="h-5 w-full" />
                <SkeletonBar className="h-5 w-2/3" />
              </div>
            ) : (
              <p className="font-body-lg text-on-surface/90 italic mb-md border-l-2 border-[#d1c793] pl-md py-sm">
                &ldquo;{prompt}&rdquo;
              </p>
            )}
            <button
              className="bg-transparent border border-[#d1c793] text-[#d1c793] px-lg py-3 rounded-full font-label-md hover:bg-[#d1c793]/10 transition-all flex items-center justify-center gap-2 w-full md:w-auto mt-auto"
              type="button"
              onClick={onReflect}
            >
              Begin Reflection
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>

        <div className="mt-lg flex flex-col md:flex-row items-center justify-center gap-md glass-card rounded-[24px] p-md md:p-lg border border-[#d1c793]/20">
          <button
            className="bg-[#d1c793] text-on-secondary px-lg py-3 rounded-full font-label-md hover:bg-secondary-fixed-dim transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 w-full md:w-auto"
            type="button"
            onClick={onStartCheckIn}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Start New Check-In
          </button>
          <button
            className="bg-transparent border border-[#d1c793] text-[#d1c793] px-lg py-3 rounded-full font-label-md hover:bg-[#d1c793]/10 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
            type="button"
            onClick={onDashboard}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Back to Dashboard
          </button>
          <button
            className="bg-[#d1c793]/10 backdrop-blur-md border border-[#d1c793]/40 text-[#d1c793] px-lg py-3 rounded-full font-label-md hover:bg-[#d1c793]/20 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
            type="button"
            onClick={onBreathing}
          >
            <span className="material-symbols-outlined">air</span>
            Try Breathing Reset
          </button>
        </div>
      </main>

      <footer className="w-full py-lg mt-auto bg-surface-container-lowest border-t border-outline-variant/10 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-md px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto text-center md:text-left">
          <div className="font-headline-md text-[#d1c793]">Drift Journal</div>
          <div className="font-body-md text-on-surface-variant">© 2024 Drift Journal. All rights reserved.</div>
          <div className="flex flex-wrap justify-center gap-sm font-label-sm text-on-surface-variant">
            {['Privacy Policy', 'Terms of Service', 'Medical Disclaimer'].map((label, i) => (
              <span key={label} className="flex items-center gap-sm">
                {i > 0 && <span className="text-outline-variant/30">•</span>}
                <a className="hover:text-[#d1c793] transition-colors duration-200" href="#">
                  {label}
                </a>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ReportBreakdown
