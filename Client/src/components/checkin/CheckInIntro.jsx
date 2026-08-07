const CORNER_STYLE = {
  maskImage: 'linear-gradient(to top, transparent, black 20%)',
  WebkitMaskImage: 'linear-gradient(to top, transparent, black 20%)',
}

function CheckInIntro({ onStart }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#12281D' }}>
      <style>{`
        @keyframes drift-fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .drift-fade-in-up { animation: drift-fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute -top-20 -left-20 w-[600px] opacity-30 transform -rotate-12" style={CORNER_STYLE}>
          <img alt="" className="w-full h-auto" src="/checkin-left.png" />
        </div>
        <div className="absolute -bottom-20 -right-20 w-[600px] opacity-30 transform rotate-12" style={CORNER_STYLE}>
          <img alt="" className="w-full h-auto" src="/checkin-right.png" />
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-tint/10 via-transparent to-transparent pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-md px-margin-mobile mx-auto pt-8 pb-24">
        <article className="glass-card rounded-2xl p-8 md:p-10 flex flex-col items-center text-center w-full drift-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-secondary-fixed/10 flex items-center justify-center mb-6">
            <span
              className="material-symbols-outlined text-secondary-fixed text-4xl"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 200' }}
            >
              photo_camera
            </span>
          </div>
          <h1 className="font-serif text-[42px] leading-[48px] text-secondary-fixed mb-4">
            Your Emotional X-Ray
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-[280px]">
            60 seconds. Camera + mic on.
          </p>

          <div className="bg-surface-container-high/50 rounded-lg p-4 mb-8 border border-outline-variant/30 text-left w-full">
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined text-secondary-fixed-dim text-xl mt-0.5"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                security
              </span>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface mb-1">Privacy First</h3>
                <p className="font-label-sm text-label-sm text-on-surface-variant/80 leading-relaxed">
                  We need temporary access to your camera and microphone to analyze facial
                  expressions and vocal tone. Data is processed locally and never stored.
                </p>
              </div>
            </div>
          </div>

          <button
            className="w-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md py-4 px-6 rounded-full btn-glow hover:bg-secondary-fixed-dim transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 mb-6"
            type="button"
            onClick={onStart}
          >
            Start Check-In
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
          <p className="font-label-sm text-label-sm text-on-surface-variant/50 max-w-[260px]">
            Drift provides wellness insights, not medical advice.
          </p>
        </article>
      </main>
    </div>
  )
}

export default CheckInIntro
