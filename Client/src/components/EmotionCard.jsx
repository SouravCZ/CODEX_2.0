import { listReports } from '../services/emotionService'

const CHANNELS = [
  { key: 'face', label: 'Face', icon: 'sentiment_neutral' },
  { key: 'voice', label: 'Voice', icon: 'graphic_eq' },
  { key: 'vitals', label: 'Vitals', icon: 'monitor_heart' },
  { key: 'text', label: 'Words', icon: 'history_edu' },
]

function toPct(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

function EmotionCard({ report, embedded = false }) {
  const latest = report || (typeof window !== 'undefined' ? listReports()[0]?.data || null : null)

  const face = latest?.signals?.face
  const emotion = face?.detected_emotion || 'Calm'
  const confidence = toPct(face?.confidence)
  const masking = latest?.masking_level || 'Low'
  const signalScores = latest?.signal_scores || {}

  const content = (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#efe4ae]/10 flex items-center justify-center text-[#efe4ae] shrink-0">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            mood
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-body-md text-[#efe4ae] truncate">{emotion}</p>
            <span
              className={`px-2 py-0.5 rounded-full text-label-sm border ${
                masking === 'High'
                  ? 'bg-error/20 text-error border-error/30'
                  : 'bg-[#12281d] border-[#efe4ae]/20 text-[#efe4ae]'
              }`}
            >
              {masking} masking
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[#efe4ae]/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#efe4ae] transition-all duration-500"
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>
        <span className="font-label-sm text-[#efe4ae]/50">{confidence}%</span>
      </div>

      <div className="flex flex-col gap-2">
        {CHANNELS.map((ch) => {
          const score = toPct(signalScores[ch.key])
          return (
            <div key={ch.key} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[16px] text-[#efe4ae]/50 w-5">
                {ch.icon}
              </span>
              <span className="font-label-sm text-[#efe4ae]/70 w-14">{ch.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-[#efe4ae]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#efe4ae]/70 transition-all duration-500"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
              <span className="font-label-sm text-[#efe4ae]/50 w-8 text-right">{score}</span>
            </div>
          )
        })}
      </div>
    </>
  )

  if (embedded) return content

  return (
    <div className="glass-card card-lift rounded-[24px] p-6 backdrop-blur-md">
      {latest ? content : <p className="font-body-md text-[#efe4ae]/60 text-center py-4">
        Complete a check-in to see your emotional signature.
      </p>}
    </div>
  )
}

export default EmotionCard
