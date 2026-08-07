import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppNav from '../components/AppNav'
import CheckInIntro from '../components/checkin/CheckInIntro'
import CheckInCapture from '../components/checkin/CheckInCapture'
import CheckInResult from '../components/checkin/CheckInResult'
import CheckInBreathing from '../components/checkin/CheckInBreathing'
import CheckInProof from '../components/checkin/CheckInProof'
import { runCheckin, verify } from '../services/emotionService'
import { logout } from '../services/auth'

const STAGES = ['intro', 'capture', 'analyzing', 'result', 'breathing', 'proof']

function AnalyzingStage({ label }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}
    >
      <style>{`
        @keyframes drift-pulse-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          80%, 100% { transform: scale(1.6); opacity: 0; }
        }
        .drift-analyze-ring { animation: drift-pulse-ring 2.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
        @keyframes drift-analyze-spin { to { transform: rotate(360deg); } }
        .drift-analyze-spin { animation: drift-analyze-spin 2.8s linear infinite; }
      `}</style>
      <div className="relative flex flex-col items-center text-center px-6">
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border border-[#EFE4AE]/20 drift-analyze-ring"></div>
          <div className="absolute inset-4 rounded-full border border-[#EFE4AE]/15 drift-analyze-ring" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute inset-8 rounded-full border border-[#EFE4AE]/10 drift-analyze-ring" style={{ animationDelay: '1.6s' }}></div>
          <span className="material-symbols-outlined text-5xl text-[#EFE4AE] drift-analyze-spin" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>
            donut_large
          </span>
        </div>
        <h1 className="font-serif text-4xl text-[#EFE4AE] mb-3">{label}</h1>
        <p className="font-body-md text-[#EFE4AE]/70 max-w-xs">
          Aligning facial signals, voice, vitals and your words…
        </p>
      </div>
    </div>
  )
}

function CheckIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const standaloneBreathing = searchParams.get('mode') === 'breathing'
  const [stage, setStage] = useState(standaloneBreathing ? 'breathing' : STAGES[0])
  const [result, setResult] = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const [capturedBlob, setCapturedBlob] = useState(null)

  async function handleCapture({ videoBlob, journalText }) {
    setCapturedBlob(videoBlob)
    setStage('analyzing')
    try {
      const data = await runCheckin({ videoBlob, journalText })
      setResult(data)
      setStage('result')
    } catch (err) {
      setResult({ error: err.message || 'Analysis failed' })
      setStage('result')
    }
  }

  async function handleReVerify() {
    if (!capturedBlob) {
      setVerifyResult({ error: 'No captured video available to re-verify.' })
      setStage('proof')
      return
    }
    setStage('analyzing')
    try {
      const data = await verify({ videoBlob: capturedBlob, checkinId: result?.checkin_id })
      setVerifyResult(data)
      setStage('proof')
    } catch (err) {
      setVerifyResult({ error: err.message || 'Re-verification failed' })
      setStage('proof')
    }
  }

  function reportId() {
    return result?.checkin_id || (verifyResult && verifyResult.checkin_id)
  }

  return (
    <div style={{ backgroundColor: '#12281D' }}>
      {stage === 'intro' && (
        <>
          <AppNav
            active="checkin"
            onLogout={() => {
              logout()
              navigate('/')
            }}
          />
          <CheckInIntro onStart={() => setStage('capture')} />
        </>
      )}
      {stage === 'capture' && (
        <CheckInCapture onCancel={() => navigate('/dashboard')} onCapture={handleCapture} />
      )}
      {stage === 'analyzing' && <AnalyzingStage label="Reading your signals" />}
      {stage === 'result' && (
        <CheckInResult
          result={result}
          onViewDetails={() => navigate(`/report/${reportId()}`)}
          onDashboard={() => navigate('/dashboard')}
          onStartBreathing={() => setStage('breathing')}
          onSkip={() => navigate('/dashboard')}
        />
      )}
      {stage === 'breathing' && (
        <CheckInBreathing
          onCancel={standaloneBreathing ? () => navigate('/dashboard') : () => setStage('result')}
          onComplete={standaloneBreathing ? () => navigate('/dashboard') : handleReVerify}
        />
      )}
      {stage === 'proof' && (
        <CheckInProof
          result={verifyResult}
          onViewReport={() => navigate(`/report/${reportId()}`)}
          onDashboard={() => navigate('/dashboard')}
        />
      )}
    </div>
  )
}

export default CheckIn
