import { useState } from 'react'
import { guest } from '../services/auth'

const INPUT_CLASS =
  'bg-transparent border border-[#EFE4AE]/30 rounded-lg px-4 py-3 font-body-md text-body-md text-[#EFE4AE] placeholder-[#EFE4AE]/40 focus:border-[#EFE4AE] focus:ring-1 focus:ring-[#EFE4AE]/50 transition-all outline-none w-full'

function GuestNameModal({ onSuccess, onClose }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const user = await guest(trimmed)
      onSuccess(user)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Continue as Guest"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm bg-[#12281D] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[24px] p-md md:p-lg border border-[#EFE4AE]/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-3xl text-center mb-xs text-[#EFE4AE]">Continue as Guest</h2>
        <p className="font-body-md text-body-md text-[#EFE4AE]/70 text-center mb-md">
          We&apos;ll create an account with just your name — no signup needed.
        </p>
        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-[#EFE4AE]" htmlFor="guest-name">
              Your Name
            </label>
            <input
              className={INPUT_CLASS}
              id="guest-name"
              name="guest-name"
              placeholder="e.g. Alex"
              type="text"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && (
            <p className="font-label-md text-label-md text-error text-center" role="alert">
              {error}
            </p>
          )}

          <button
            className="w-full bg-[#EFE4AE] text-[#12281D] font-label-md text-label-md py-4 px-6 rounded-full hover:opacity-90 transition-opacity flex justify-center items-center gap-2 font-semibold disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Setting up…' : 'Continue'}
            {!loading && (
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            )}
          </button>
        </form>
        <button
          className="mt-md w-full font-label-sm text-label-sm text-[#EFE4AE]/60 hover:text-[#EFE4AE] transition-colors underline underline-offset-4 decoration-[#EFE4AE]/40"
          type="button"
          onClick={onClose}
          disabled={loading}
        >
          Back to login
        </button>
      </div>
    </div>
  )
}

export default GuestNameModal
