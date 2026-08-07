import { useEffect, useRef, useState } from 'react'

const botanicals = [
  { src: '/breathe-left.png', side: 'left', anim: 'animate-sway-left' },
  { src: '/breathe-right.png', side: 'right', anim: 'animate-sway-right' },
]

function CheckInBreathing({ duration = 60, onCancel, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [inPhase, setInPhase] = useState(true)
  const [done, setDone] = useState(false)
  const [musicOn, setMusicOn] = useState(true)
  const timers = useRef([])
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio('/the_mountain-breathing-calm-139520.mp3')
    audio.loop = true
    audio.volume = 0.4
    audioRef.current = audio
    audio.play().catch(() => {})
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicOn) audio.play().catch(() => {})
    else audio.pause()
  }, [musicOn])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    timers.current.push(
      setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timers.current[0])
            setDone(true)
            return 0
          }
          return t - 1
        })
      }, 1000),
      setInterval(() => {
        if (prefersReducedMotion) return
        setInPhase((p) => !p)
      }, 4000)
    )
    return () => {
      timers.current.forEach(clearInterval)
      timers.current = []
    }
  }, [])

  const instruction = done ? 'Done' : inPhase ? 'Breathe In' : 'Breathe Out'

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden relative font-body-md"
      style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}
    >
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 0.4; }
        }
        .breathe-animation { animation: breathe 8s ease-in-out infinite; }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          80%, 100% { transform: scale(1.5); opacity: 0; }
        }
        .pulse-soft { animation: pulse-ring 4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
        @keyframes sway-left {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes sway-right {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-3deg); }
        }
        .animate-sway-left { animation: sway-left 7s ease-in-out infinite; transform-origin: bottom left; }
        .animate-sway-right { animation: sway-right 8s ease-in-out infinite; transform-origin: bottom right; }
        @keyframes drift-instr-in { from { opacity: 0; } to { opacity: 1; } }
        .drift-instr { animation: drift-instr-in 0.5s ease; }
        @media (prefers-reduced-motion: reduce) {
          .breathe-animation, .pulse-soft, .animate-sway-left, .animate-sway-right { animation: none !important; }
        }
      `}</style>

      {botanicals.map(({ src, side, anim }) => (
        <img
          key={side}
          alt=""
          className={`absolute ${side === 'left' ? 'left-[-5%]' : 'right-[-5%]'} bottom-[-5%] h-[80vh] object-contain opacity-30 pointer-events-none z-0 ${anim}`}
          src={src}
          style={{
            maskImage: 'linear-gradient(to top, transparent 5%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 5%, black 40%)',
          }}
        />
      ))}

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-primary-container/30 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary-container/20 blur-[100px]"></div>
      </div>

      <header className="relative z-10 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6">
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-[#EFE4AE]/20 hover:bg-white/10 backdrop-blur-md transition-colors text-[#EFE4AE]"
          type="button"
          onClick={onCancel}
          aria-label="Close breathing reset"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-[#EFE4AE]/30 hover:bg-white/10 transition-colors text-[#EFE4AE]"
            type="button"
            onClick={() => setMusicOn((m) => !m)}
            aria-label={musicOn ? 'Mute music' : 'Play music'}
            aria-pressed={musicOn}
          >
            <span className="material-symbols-outlined">{musicOn ? 'music_note' : 'music_off'}</span>
            <span className="font-label-sm text-label-sm">{musicOn ? 'On' : 'Off'}</span>
          </button>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-[#EFE4AE]/30">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EFE4AE] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EFE4AE]"></span>
            </span>
            <span className="font-serif text-lg text-[#EFE4AE] tracking-wide">Camera Active</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-8 max-w-7xl mx-auto w-full">
        <div className="mb-12 text-center">
          <p className="font-serif text-[80px] leading-none text-[#EFE4AE] tabular-nums">
            {timeLeft}
          </p>
          <p className="font-serif text-xl text-[#EFE4AE]/80 mt-2 tracking-widest">
            Seconds Remaining
          </p>
        </div>

        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-16">
          <div className="absolute inset-0 rounded-full border border-[#EFE4AE]/20 pulse-soft" style={{ animationDelay: '0s' }}></div>
          <div className="absolute inset-0 rounded-full border border-primary-fixed/20 pulse-soft" style={{ animationDelay: '2s' }}></div>
          <div className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-primary-container to-[#504921] opacity-80 blur-md breathe-animation"></div>
          <div
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/5 backdrop-blur-xl border border-[#EFE4AE]/30 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(18,40,29,0.5)] transition-transform duration-1000 ease-in-out"
            style={{ transform: `scale(${done ? 1 : inPhase ? 1.1 : 0.9})` }}
          >
            <span
              key={instruction}
              className="drift-instr font-serif text-3xl text-[#EFE4AE] text-center px-4"
            >
              {instruction}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-auto">
          <p className="font-body-md text-[16px] text-[#EFE4AE]/80 text-center max-w-md">
            Follow the circle. We are quietly measuring your resting heart rate.
          </p>
          <button
            className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 backdrop-blur-md border border-[#EFE4AE]/40 text-[#EFE4AE] font-serif text-xl hover:bg-white/10 transition-all shadow-[0_8px_16px_rgba(18,40,29,0.3)] active:scale-95"
            type="button"
            onClick={onComplete}
          >
            <span className="material-symbols-outlined group-hover:-rotate-90 transition-transform duration-500">
              refresh
            </span>
            Re-Verify Baseline
          </button>
        </div>
      </main>
    </div>
  )
}

export default CheckInBreathing
