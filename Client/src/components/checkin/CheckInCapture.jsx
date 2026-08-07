import { useEffect, useRef, useState } from 'react'

const MAX_SECONDS = 60

function describeMediaError(err) {
  const name = err && err.name
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'Your browser blocked camera access. This page needs a secure connection — use https:// or http://localhost.'
  }
  if (name === 'NotAllowedError') {
    return 'Camera or microphone access was denied. Click the camera icon in your address bar, choose "Allow", and try again.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera or microphone was found. Connect a device and try again.'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your camera or microphone is in use by another app or tab. Close it and try again.'
  }
  if (name === 'SecurityError') {
    return 'Your browser blocked camera access. This page needs a secure connection — use https:// or http://localhost.'
  }
  if (name === 'OverconstrainedError') {
    return 'Your camera could not match the requested settings. Try again.'
  }
  if (name === 'AbortError') {
    return 'Camera setup was interrupted. Please try again.'
  }
  return 'Could not access your camera or microphone. Please check your device settings and try again.'
}

function openStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const err = new Error('mediaDevices unavailable')
    err.name = 'SecurityError'
    return Promise.reject(err)
  }
  return navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch((err) => {
    // If only audio was denied/missing, fall back to video-only so the
    // check-in still captures face + vitals (voice degrades gracefully).
    if (err && ['NotAllowedError', 'NotFoundError', 'DevicesNotFoundError'].includes(err.name)) {
      return navigator.mediaDevices.getUserMedia({ video: true })
    }
    throw err
  })
}

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function CheckInCapture({ onCancel, onCapture }) {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)
  const notesRef = useRef('')
  const [recording, setRecording] = useState(false)
  const [starting, setStarting] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let disposed = false
    let stream = null

    async function start() {
      setError('')
      setStarting(true)
      try {
        stream = await openStream()
      } catch (err) {
        if (disposed) return
        setError(describeMediaError(err))
        setStarting(false)
        return
      }
      if (disposed) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      const chunks = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      recorder.onstop = () => {
        if (disposed) return
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
        stream.getTracks().forEach((t) => t.stop())
        onCapture({ videoBlob: blob, journalText: notesRef.current })
      }
      recorder.start(1000)
      setRecording(true)
      setStarting(false)
      setSeconds(0)

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) stopRecording()
          return s + 1
        })
      }, 1000)
    }

    start()

    return () => {
      disposed = true
      if (timerRef.current) clearInterval(timerRef.current)
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    setRecording(false)
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden relative"
      style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}
    >
      <style>{`
        @keyframes drift-pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .drift-recording-pulse { animation: drift-pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes drift-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .drift-ticker { animation: drift-ticker 10s linear infinite; }
      `}</style>

      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">
        <button
          className="text-[#EFE4AE] hover:text-[#EFE4AE]/80 transition-colors duration-300 flex items-center gap-2 group"
          type="button"
          onClick={onCancel}
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          <span className="font-label-md text-label-md">Cancel Check-in</span>
        </button>
        <div className="font-headline-md text-headline-md font-semibold text-[#EFE4AE]">
          Drift Journal
        </div>
      </header>

      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex justify-between items-end">
          <img
            alt="Eucalyptus branch"
            className="w-[30vw] md:w-96 h-auto opacity-30 object-contain origin-bottom-left [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] mb-[-5%] ml-[-5%]"
            src="/capture-left.png"
          />
          <img
            alt="Palm frond"
            className="w-[30vw] md:w-96 h-auto opacity-30 object-contain origin-bottom-right [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] mb-[-5%] mr-[-5%]"
            src="/capture-right.png"
          />
        </div>

        <section className="bg-[#12281D]/40 backdrop-blur-md w-full max-w-4xl rounded-[32px] p-6 md:p-12 relative z-10 flex flex-col gap-8 shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-[#EFE4AE]/20">
          <div className="text-center space-y-4">
            <h1 className="font-instrument text-display-lg-mobile md:text-display-lg text-[#EFE4AE] italic tracking-wide">
              How are you feeling today?
            </h1>
            <p className="font-body-md text-body-md text-[#EFE4AE]/80 max-w-lg mx-auto">
              Take a deep breath. We&apos;re capturing your baseline to personalize your wellness
              journey.
            </p>
          </div>

          <div className="relative w-full aspect-video md:aspect-[21/9] bg-surface-container rounded-2xl overflow-hidden border border-[#EFE4AE]/10 group">
            {error ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
                <span className="material-symbols-outlined text-5xl text-error">videocam_off</span>
                <p className="font-body-md text-body-md text-[#EFE4AE]/80 max-w-sm">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                  <button
                    className="bg-[#EFE4AE] text-[#12281D] font-label-md text-label-md rounded-full px-6 py-3 hover:bg-[#EFE4AE]/90 transition-all duration-300 active:scale-95"
                    type="button"
                    onClick={() => setAttempt((a) => a + 1)}
                  >
                    Try Again
                  </button>
                  <button
                    className="border border-[#EFE4AE]/40 text-[#EFE4AE] font-label-md text-label-md rounded-full px-6 py-3 hover:bg-[#EFE4AE]/10 transition-all duration-300 active:scale-95"
                    type="button"
                    onClick={onCancel}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
              ></video>
            )}

            {!error && (
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <div className="bg-surface-container-highest/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-outline/20">
                    <div
                      className={`w-2 h-2 rounded-full bg-[#EFE4AE] ${
                        recording ? 'drift-recording-pulse' : ''
                      }`}
                    ></div>
                    <span className="font-label-sm text-label-sm text-on-surface">REC</span>
                    <span className="font-label-md text-label-md text-[#EFE4AE] font-mono ml-2">
                      {formatTime(seconds)}
                    </span>
                  </div>
                  <div className="bg-surface-container-highest/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline/20">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      visibility
                    </span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border border-[#EFE4AE]/20 rounded-full relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#EFE4AE] rounded-full"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#EFE4AE] rounded-full"></div>
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#EFE4AE] rounded-full"></div>
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#EFE4AE] rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!error && (
            <>
              <div className="w-full overflow-hidden bg-[#12281D]/50 rounded-full py-2 border border-[#EFE4AE]/10 relative">
                <div className="flex whitespace-nowrap drift-ticker">
                  <span className="font-label-sm text-label-sm text-[#EFE4AE] uppercase tracking-widest px-8">
                    scanning face · listening · reading heartbeat ·
                  </span>
                  <span className="font-label-sm text-label-sm text-[#EFE4AE] uppercase tracking-widest px-8">
                    scanning face · listening · reading heartbeat ·
                  </span>
                </div>
              </div>

              <div className="w-full">
                <label className="sr-only" htmlFor="checkin-notes">
                  Optional Notes
                </label>
                <textarea
                  className="w-full bg-[#12281D]/30 border border-[#EFE4AE]/20 rounded-xl px-4 py-3 font-body-md text-body-md text-[#EFE4AE] placeholder:text-[#EFE4AE]/50 focus:border-[#EFE4AE] focus:ring-1 focus:ring-[#EFE4AE] transition-all resize-none shadow-inner"
                  id="checkin-notes"
                  placeholder="Add optional notes about how you're feeling..."
                  rows="2"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    notesRef.current = e.target.value
                  }}
                ></textarea>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  className="bg-[#EFE4AE] text-[#12281D] font-label-md text-label-md rounded-full px-xl py-4 flex items-center gap-2 hover:bg-[#EFE4AE]/90 transition-all duration-300 shadow-[0_8px_16px_rgba(239,228,174,0.1)] active:scale-95"
                  type="button"
                  onClick={stopRecording}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    stop_circle
                  </span>
                  {starting ? 'Starting…' : 'Stop Capture'}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default CheckInCapture
