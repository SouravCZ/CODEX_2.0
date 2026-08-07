import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import TrendChart from '../components/TrendChart'
import EmotionCard from '../components/EmotionCard'
import InsightsPanel from '../components/InsightsPanel'
import AppNav from '../components/AppNav'
import { ParticleCard, GlobalSpotlight } from '../components/MagicBento'
import { listReports } from '../services/emotionService'
import { getLatestInsight, getTrend } from '../services/emotionService'

const defaultBars = [40, 50, 45, 70, 65, 80, 82]

const TREND_METRICS = ['Wellness Score', 'Masking Level', 'Energy Baseline']

function MetricDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 bg-[#12281d] border border-[#efe4ae]/20 text-[#efe4ae] text-sm font-label-md rounded-xl px-4 py-2.5 outline-none cursor-pointer hover:border-[#eee3ae]/60 hover:bg-[#1b2a20] focus:ring-2 focus:ring-[#eee3ae]/60 transition-all duration-300"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value}</span>
        <span className="material-symbols-outlined text-[18px]">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <ul
          className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden border border-[#eee3ae]/20 bg-[#141c15]/95 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] z-20 py-1.5"
          role="listbox"
        >
          {TREND_METRICS.map((m) => (
            <li key={m}>
              <button
                type="button"
                role="option"
                aria-selected={m === value}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                  m === value
                    ? 'text-[#12281d] bg-[#eee3ae]'
                    : 'text-[#efe4ae] hover:text-[#12281d] hover:bg-[#eee3ae]'
                }`}
                onClick={() => {
                  onChange(m)
                  setOpen(false)
                }}
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AnimatedCard({ children, className = '', wrapperClassName = '', delay = 0 }) {
  return (
    <motion.div
      className={wrapperClassName}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
      <ParticleCard
        className={`${className} magic-bento-card--border-glow${wrapperClassName ? ' h-full' : ''}`}
        glowColor="225, 218, 166"
        clickEffect
        enableTilt={false}
        enableMagnetism={false}
      >
        {children}
      </ParticleCard>
    </motion.div>
  )
}

function toPct(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 40
  return Math.max(8, Math.min(95, Math.round(value * 100)))
}

function formatLogDate(iso) {
  if (!iso) return 'Recently'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Recently'
  const now = new Date()
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (sameDay(d, now)) return `Today, ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, yesterday)) return `Yesterday, ${time}`
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
}

function Dashboard({
  userName = 'Ankan',
  dateLabel = 'October 24, 2024',
  driftStatus,
  driftBody,
  forecast,
  wellnessIndex,
  wellnessLabel,
  bars,
  trend,
  logs,
  onStartCheckIn,
  onLogout,
  onNavigate,
  onBreathing,
  onOpenReport,
}) {
  const [latest] = useState(() => (typeof window !== 'undefined' ? listReports()[0] || null : null))
  const [insight, setInsight] = useState(null)
  const [trendData, setTrendData] = useState(trend || null)
  const [trendMetric, setTrendMetric] = useState(TREND_METRICS[0])
  const bentoRef = useRef(null)

  useEffect(() => {
    getLatestInsight().then(setInsight).catch(() => {})
    getTrend().then(setTrendData).catch(() => {})
  }, [])

  const latestData = latest?.data || null

  const resolvedIndex =
    wellnessIndex ?? (latestData && typeof latestData.wellness_index === 'number' ? Math.round(latestData.wellness_index) : 82)
  const resolvedLabel =
    wellnessLabel ?? (latestData?.signals?.face?.detected_emotion || 'Signals aligned')
  const resolvedStatus = driftStatus ?? insight?.drift_status ?? 'Stable'
  const resolvedBody =
    driftBody ??
    insight?.summary ??
    'Your signals have been consistent over the last 3 days. Masking efforts appear low, and baseline energy is sustained.'
  const resolvedForecast =
    forecast ??
    insight?.recommendation ??
    'No immediate risk trend detected.'

  const resolvedBars = bars ?? (trendData?.sentiment_scores?.length ? trendData.sentiment_scores.slice(-7).map(toPct) : defaultBars)
  const resolvedLogs =
    logs ??
    (latest
      ? [
          {
            id: latest.checkin_id,
            date: formatLogDate(latest.saved_at),
            masking: latestData.masking_level || 'Low',
            index: Math.round(latestData.wellness_index ?? 82),
            emotion: latestData.signals?.face?.detected_emotion || 'Calm',
          },
        ]
      : [])

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: '#12281d', color: '#efe4ae' }}>
      <div
        className="fixed top-[-10%] left-[-15%] w-[70vw] h-[120vh] pointer-events-none z-0 mix-blend-screen"
        style={{
          backgroundImage: 'url("/dashboard-left.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left center',
          opacity: 0.05,
        }}
      ></div>
      <div
        className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[100vh] pointer-events-none z-0 mix-blend-screen"
        style={{
          backgroundImage: 'url("/dashboard-right.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right bottom',
          opacity: 0.03,
        }}
      ></div>

      <AppNav active="dashboard" onLogout={onLogout} />

      <GlobalSpotlight gridRef={bentoRef} glowColor="225, 218, 166" />

      <main
        ref={bentoRef}
        className="bento-section flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg flex flex-col gap-lg z-10 relative"
      >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-md">
          <div>
            <p className="font-label-md text-[#efe4ae]/70 mb-2">{dateLabel}</p>
            <h1 className="font-serif text-5xl md:text-display-lg text-[#efe4ae] tracking-tight">
              Good evening, {userName}
            </h1>
          </div>
          <button
            className="bg-[#efe4ae] text-[#12281d] px-8 py-3 rounded-full font-label-md hover:bg-[#efe4ae]/90 transition-colors flex items-center gap-2 shadow-[inset_0_0_8px_rgba(255,255,255,0.4)]"
            type="button"
            onClick={onStartCheckIn}
          >
            <span className="material-symbols-outlined">edit</span>
            Start a Check-In
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-4 flex flex-col gap-gutter">
            <AnimatedCard delay={0.05} className="glass-card rounded-[20px] p-6 flex flex-col gap-4 overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#efe4ae] to-transparent opacity-50"></div>
              <div className="flex justify-between items-center">
                <h2 className="font-headline-md text-[#efe4ae]">Drift Status</h2>
                <span className="bg-[#12281d] text-[#efe4ae] px-3 py-1 rounded-full font-label-sm border border-[#efe4ae]/20 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#efe4ae]"></span>
                  {resolvedStatus}
                </span>
              </div>
              <p className="font-body-md text-[#efe4ae]/80 leading-relaxed">{resolvedBody}</p>
              <div className="mt-2 bg-[#08160F] p-4 rounded-xl border border-[#efe4ae]/10">
                <p className="font-label-sm text-[#efe4ae]/60 uppercase tracking-wider mb-1">Forecast</p>
                <p className="font-body-md text-[#efe4ae]">{resolvedForecast}</p>
              </div>
              <button
                className="mt-2 text-[#efe4ae] text-left font-label-md flex items-center gap-2 hover:opacity-80 transition-opacity w-max group"
                type="button"
                onClick={onBreathing}
              >
                Try a breathing exercise
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </AnimatedCard>

            <AnimatedCard delay={0.12} className="glass-card rounded-[20px] p-6 flex flex-col justify-between min-h-[200px] backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-md text-[#efe4ae]/70">Wellness Index</p>
                  <h3 className="font-serif text-6xl text-[#efe4ae] mt-2">{resolvedIndex}</h3>
                  <p className="font-label-sm text-[#efe4ae]/60 mt-1">{resolvedLabel}</p>
                </div>
                <span className="material-symbols-outlined text-[#efe4ae] opacity-50" style={{ fontSize: 32 }}>
                  vital_signs
                </span>
              </div>
              <div className="mt-6 flex w-full justify-between items-end">
                {resolvedBars.map((height, i) => (
                  <div
                    key={i}
                    className="w-3 rounded-[2px] transition-all duration-300"
                    style={{
                      height: `${height}%`,
                      backgroundColor: i === resolvedBars.length - 1 ? '#efe4ae' : 'rgba(239, 228, 174, 0.3)',
                    }}
                  ></div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-[#efe4ae]/10">
                <EmotionCard report={latestData} embedded />
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.19} className="glass-card rounded-[20px] p-6 backdrop-blur-md">
              <InsightsPanel embedded />
            </AnimatedCard>

            <AnimatedCard
              delay={0.26}
              className="glass-card rounded-[20px] p-5 flex items-center gap-4 cursor-pointer hover:bg-surface-container-high transition-colors backdrop-blur-md"
            >
              <button
                className="w-full flex items-center gap-4 text-left"
                type="button"
                onClick={onBreathing}
              >
                <div className="w-12 h-12 rounded-full bg-[#12281d] flex items-center justify-center text-[#efe4ae] shrink-0 border border-[#efe4ae]/10">
                  <span className="material-symbols-outlined">air</span>
                </div>
                <div>
                  <h4 className="font-label-md text-[#efe4ae] mb-1">60-second breathing reset</h4>
                  <p className="font-label-sm text-[#efe4ae]/60">Recommended based on current time.</p>
                </div>
              </button>
            </AnimatedCard>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-gutter">
            <AnimatedCard delay={0.33} wrapperClassName="flex-grow" className="glass-card rounded-[20px] p-6 md:p-8 flex flex-col backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-md text-[#efe4ae]">14-Day Trend</h2>
                <MetricDropdown value={trendMetric} onChange={setTrendMetric} />
              </div>
              <div className="flex-grow w-full relative min-h-[250px]">
                <TrendChart data={trendData} />
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.4} className="glass-card rounded-[20px] overflow-hidden backdrop-blur-md">
              <div className="px-6 py-5 border-b border-[#efe4ae]/20 flex justify-between items-center">
                <h2 className="font-headline-md text-[#efe4ae]">Recent Logs</h2>
                <button className="text-label-sm font-label-sm text-[#efe4ae] hover:underline" type="button" onClick={() => onNavigate && onNavigate('journal')}>
                  View All
                </button>
              </div>
              <div className="w-full">
                <div className="grid grid-cols-4 px-6 py-3 bg-surface-container-low/50 text-label-sm text-[#efe4ae]/60 uppercase tracking-wider">
                  <div>Date</div>
                  <div>Masking</div>
                  <div>Index</div>
                  <div>Emotion</div>
                </div>
                {resolvedLogs.length === 0 ? (
                  <p className="font-body-md text-[#efe4ae]/60 text-center py-10 px-6">
                    No check-ins yet. Start one to see your logs here.
                  </p>
                ) : (
                  <div className="divide-y divide-[#efe4ae]/10">
                    {resolvedLogs.map((log) => {
                      const masked = log.masking === 'High'
                      return (
                        <div
                          key={log.id}
                          className="grid grid-cols-4 px-6 py-4 items-center hover:bg-surface-container-high transition-colors cursor-pointer"
                          onClick={() => onOpenReport && onOpenReport(log.id)}
                        >
                          <div className="font-body-md text-[#efe4ae]">{log.date}</div>
                          <div>
                            <span
                              className={
                                masked
                                  ? 'inline-block px-2 py-1 rounded bg-error/20 text-error border border-error/30 text-label-sm'
                                  : 'inline-block px-2 py-1 rounded bg-[#12281d] border border-[#efe4ae]/20 text-label-sm text-[#efe4ae]'
                              }
                            >
                              {log.masking}
                            </span>
                          </div>
                          <div className={`font-body-md ${masked ? 'text-error' : 'text-[#efe4ae]'}`}>
                            {log.index}
                          </div>
                          <div className="flex items-center gap-2 text-[#efe4ae]/80">
                            <span className={`w-2 h-2 rounded-full ${masked ? 'bg-error' : 'bg-[#efe4ae]'}`}></span>
                            {log.emotion}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </AnimatedCard>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container-lowest text-[#efe4ae]/60 font-label-sm border-t border-[#efe4ae]/20 opacity-80 hover:opacity-100 transition-opacity mt-auto z-10">
        <div className="flex flex-col gap-sm items-center w-full px-margin-mobile md:px-margin-desktop py-lg text-center mt-xl max-w-7xl mx-auto">
          <div className="font-serif text-2xl italic text-[#efe4ae] mb-2">Drift Journal</div>
          <div className="flex gap-6 mb-4">
            {['Privacy Policy', 'Terms of Service', 'Support'].map((label) => (
              <a key={label} className="text-[#efe4ae]/60 hover:text-[#efe4ae] transition-colors" href="#">
                {label}
              </a>
            ))}
          </div>
          <p className="max-w-2xl text-sm opacity-70">
            © 2024 Drift Journal. Medical Disclaimer: This dashboard is for informational purposes only and
            does not substitute professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
