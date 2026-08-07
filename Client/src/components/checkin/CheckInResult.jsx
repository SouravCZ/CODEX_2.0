const sidePanel = (src, side) => ({
  position: 'absolute',
  [side]: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  opacity: 0.3,
  backgroundImage: `url("${src}")`,
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `${side} center`,
  width: 400,
  height: 800,
  pointerEvents: 'none',
  zIndex: 0,
  maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
})

function signalCards(signals) {
  const s = signals || {}
  const cards = []

  if (s.text) {
    const pct = Math.round((s.text.sentiment_score ?? 0) * 100)
    cards.push({
      key: 'words',
      icon: 'edit_note',
      label: 'Words',
      value: s.text.sentiment_label || 'neutral',
      sub: pct >= 0 ? `${pct}% positive` : `${-pct}% negative`,
    })
  }
  if (s.face) {
    cards.push({
      key: 'face',
      icon: 'sentiment_satisfied',
      label: 'Expression',
      value: s.face.detected_emotion || '—',
      sub: typeof s.face.confidence === 'number'
        ? `${Math.round(s.face.confidence * 100)}% confidence`
        : '',
    })
  }
  if (s.voice) {
    cards.push({
      key: 'voice',
      icon: 'record_voice_over',
      label: 'Voice',
      value: s.voice.voice_tone || '—',
      sub: typeof s.voice.vitality === 'number'
        ? `${Math.round(s.voice.vitality * 100)}% vitality`
        : '',
    })
  }
  if (s.vitals) {
    cards.push({
      key: 'vitals',
      icon: 'monitor_heart',
      label: 'Vitals',
      value: typeof s.vitals.hr_bpm === 'number' ? `${Math.round(s.vitals.hr_bpm)} bpm` : '—',
      sub: typeof s.vitals.stress_vital === 'number'
        ? `${Math.round(s.vitals.stress_vital * 100)}% stress`
        : '',
    })
  }
  return cards
}

function CheckInResult({ result, onViewDetails, onDashboard, onStartBreathing, onSkip }) {
  if (result?.error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop relative overflow-hidden"
        style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}
      >
        <div className="glass-card w-full max-w-md rounded-[32px] p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-[#12281D]/50 border border-[#EFE4AE]/30 flex items-center justify-center mb-8">
            <span
              className="material-symbols-outlined text-[#EFE4AE] text-[40px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              error
            </span>
          </div>
          <h1 className="font-serif text-headline-lg text-[#EFE4AE] mb-4">
            We couldn&apos;t read your signals
          </h1>
          <p className="font-body-lg text-[#EFE4AE]/80 mb-10 max-w-sm">{result.error}</p>
          <button
            className="px-8 py-4 bg-[#EFE4AE] text-[#12281D] font-label-md rounded-2xl transition-all duration-300 transform active:scale-95"
            type="button"
            onClick={onDashboard}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const masked = result && result.aligned === false
  const score = result && typeof result.wellness_index === 'number' ? Math.round(result.wellness_index) : null
  const cards = signalCards(result?.signals)
  const topGap = result?.disagreements?.[0]
  const title = masked ? 'Masked stress detected' : 'You are in a state of quiet balance.'
  const body = masked
    ? result?.explanation ||
      "You said you're fine, but your heartbeat says otherwise. Let's take a moment to recalibrate."
    : result?.explanation ||
      'Your recent reflections indicate a strong grounding in your daily routines. The ecosystem of your well-being is flourishing. Maintain this gentle momentum.'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop overflow-hidden relative"
      style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}
    >
      <style>{`
        @keyframes drift-fade-up {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .drift-fade-up { animation: drift-fade-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .drift-score-glow { text-shadow: 0 0 80px rgba(239, 228, 174, 0.2); }
        @keyframes drift-spin { to { transform: rotate(360deg); } }
        .drift-spin-slow { animation: drift-spin 3s linear infinite; }
      `}</style>

      <div style={sidePanel(masked ? '/masked-left.png' : '/result-left.png', 'left')}></div>
      <div style={sidePanel(masked ? '/masked-right.png' : '/result-right.png', 'right')}></div>

      <main className="w-full max-w-2xl mx-auto relative z-10 flex flex-col items-center">
        <div className="glass-card w-full rounded-[32px] p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden drift-fade-up">
          {masked && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-error-container to-transparent opacity-50"></div>
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square border border-[#EFE4AE]/10 rounded-full pointer-events-none"></div>

          {masked ? (
            <>
              <div className="w-20 h-20 rounded-full bg-[#12281D]/50 border border-[#EFE4AE]/30 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-error-container/20 animate-pulse"></div>
                <span
                  className="material-symbols-outlined text-[#EFE4AE] text-[40px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </div>
              <h1 className="font-serif text-display-lg-mobile md:text-display-lg text-[#EFE4AE] mb-4 tracking-tight leading-tight">
                {title}
              </h1>
              <p className="font-body-lg text-[#EFE4AE]/80 mb-10 max-w-sm">{body}</p>

              {topGap && (
                <div className="w-full mb-4 flex items-center justify-center gap-2 rounded-full border border-[#EFE4AE]/15 px-5 py-3">
                  <span className="material-symbols-outlined text-[#EFE4AE]/80 text-[18px]">swap_horiz</span>
                  <p className="font-label-sm text-[#EFE4AE]/80">
                    {topGap.pair} — {Math.round(topGap.delta * 100)}% apart
                  </p>
                </div>
              )}

              {cards.length > 0 && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  {cards.map((c) => (
                    <div
                      key={c.key}
                      className="bg-[#12281D]/30 rounded-2xl p-5 flex flex-col items-center justify-center border border-[#EFE4AE]/20 text-center"
                    >
                      <span className="material-symbols-outlined text-[24px] text-[#EFE4AE]/80 mb-2">
                        {c.icon}
                      </span>
                      <span className="font-label-sm text-[#EFE4AE]/70 mb-1">{c.label}</span>
                      <span className="font-headline-md text-[#EFE4AE] font-semibold mb-1 capitalize">
                        {c.value}
                      </span>
                      <span className="font-label-sm text-xs text-[#EFE4AE]/60">{c.sub}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="w-full bg-[#EFE4AE] text-[#12281D] py-5 px-8 rounded-full font-label-md shadow-[inset_0_0_0_0.5px_rgba(238,227,173,0.5)] hover:bg-[#EFE4AE]/90 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 group"
                type="button"
                onClick={onStartBreathing}
              >
                <span className="material-symbols-outlined drift-spin-slow">air</span>
                Start 60-Second Breathing Reset
              </button>
              <button
                className="w-full mt-4 bg-transparent border border-[#EFE4AE]/60 text-[#EFE4AE] py-4 px-8 rounded-full font-label-md hover:bg-[#EFE4AE]/10 transition-colors duration-300 flex items-center justify-center gap-3"
                type="button"
                onClick={onViewDetails}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                  analytics
                </span>
                View Details
              </button>
              <button
                className="mt-6 font-label-sm text-[#EFE4AE]/70 hover:text-[#EFE4AE] transition-colors pb-1 border-b border-transparent hover:border-[#EFE4AE]"
                type="button"
                onClick={onSkip}
              >
                I&apos;m actually fine, skip for now
              </button>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12281D]/50 border border-[#EFE4AE]/30 mb-8 backdrop-blur-sm">
                <span
                  className="material-symbols-outlined text-[#EFE4AE] text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  spa
                </span>
                <span className="font-label-md text-[#EFE4AE] uppercase tracking-widest">
                  Aligned Stage
                </span>
              </div>
              <div className="flex items-baseline mb-6">
                <div className="font-serif text-[120px] leading-none text-[#EFE4AE] drift-score-glow tabular-nums tracking-tighter">
                  {score ?? '—'}
                </div>
                <div className="font-headline-md text-[#EFE4AE]/60 ml-2">/100</div>
              </div>
              <h1 className="font-serif text-headline-lg text-[#EFE4AE] mb-4 max-w-md">{title}</h1>
              <p className="font-body-lg text-[#EFE4AE]/80 max-w-lg mb-12 leading-relaxed">{body}</p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
                <button
                  className="px-8 py-4 bg-[#EFE4AE] text-[#12281D] font-label-md rounded-2xl hover:shadow-[inset_0_0_12px_rgba(255,255,255,0.2),0_8px_24px_-8px_rgba(239,228,174,0.3)] transition-all duration-300 flex items-center justify-center gap-2 min-w-[200px]"
                  type="button"
                  onClick={onViewDetails}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                    analytics
                  </span>
                  View Details
                </button>
                <button
                  className="px-8 py-4 bg-transparent border border-[#EFE4AE] text-[#EFE4AE] font-label-md rounded-2xl hover:bg-[#EFE4AE]/10 transition-colors duration-300 flex items-center justify-center gap-2 min-w-[200px]"
                  type="button"
                  onClick={onDashboard}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                    arrow_back
                  </span>
                  Back to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default CheckInResult
