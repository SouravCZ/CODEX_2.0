import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GuestNameModal from '../components/GuestNameModal'
import { login } from '../services/auth'

const INPUT_CLASS =
  'bg-transparent border border-[#EFE4AE]/30 rounded-lg px-4 py-3 font-body-md text-body-md text-[#EFE4AE] placeholder-[#EFE4AE]/40 focus:border-[#EFE4AE] focus:ring-1 focus:ring-[#EFE4AE]/50 transition-all shadow-[inset_0_0_0_0.5px_transparent] focus:shadow-[inset_0_0_0_0.5px_rgba(239,228,174,0.3)] outline-none'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestOpen, setGuestOpen] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ username: email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  function handleGuestSuccess() {
    navigate('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex flex-col font-body-md text-body-md antialiased overflow-hidden relative"
      style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}
    >
      <main className="flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop">
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
          <div
            className="absolute -top-20 -left-20 w-1/2 max-w-[600px] transform -rotate-12"
            style={{ maskImage: 'linear-gradient(black 70%, transparent 100%)', opacity: 0.3 }}
          >
            <img alt="" className="w-full h-auto" src="/login-left.png" />
          </div>
          <div
            className="absolute -bottom-20 -right-20 w-1/2 max-w-[600px] transform rotate-12"
            style={{ maskImage: 'linear-gradient(to top, transparent 0%, black 30%)', opacity: 0.3 }}
          >
            <img alt="" className="w-full h-auto" src="/login-right.png" />
          </div>
        </div>

        <div className="w-full max-w-md flex flex-col items-center relative" style={{ zIndex: 10 }}>
          <div className="mb-lg flex flex-col items-center">
            <h1 className="font-serif text-5xl md:text-display-lg text-[#EFE4AE] mb-xs">
              Drift Journal
            </h1>
            <p className="font-body-md text-body-md text-[#EFE4AE]/70 text-center max-w-[280px]">
              Quiet sophistication for your digital wellness.
            </p>
          </div>

          <div className="w-full bg-[#12281D] shadow-[0_8px_32px_rgba(18,40,29,0.4)] rounded-[24px] p-md md:p-lg border border-[#EFE4AE]/10 backdrop-blur-sm">
            <h2 className="font-serif text-4xl text-center mb-md text-[#EFE4AE]">Welcome Back</h2>
            <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-[#EFE4AE]" htmlFor="email">
                  Email Address
                </label>
                <input
                  className={INPUT_CLASS}
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-xs">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-label-md text-[#EFE4AE]" htmlFor="password">
                    Password
                  </label>
                  <a
                    className="font-label-sm text-label-sm text-[#EFE4AE]/70 hover:text-[#EFE4AE] transition-colors"
                    href="#"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    className={`${INPUT_CLASS} pr-12`}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-[#EFE4AE]/60 hover:text-[#EFE4AE] hover:bg-[#EFE4AE]/10 transition-colors"
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    tabIndex="-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="font-label-md text-label-md text-error text-center" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-sm mt-sm">
                <button
                  className="w-full bg-[#EFE4AE] text-[#12281D] font-label-md text-label-md py-4 px-6 rounded-full hover:opacity-90 transition-opacity flex justify-center items-center gap-2 glow-active font-semibold disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Logging in…' : 'Login'}
                  {!loading && (
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  )}
                </button>
                <div className="relative flex items-center py-sm">
                  <div className="flex-grow border-t border-[#EFE4AE]/20"></div>
                  <span className="flex-shrink-0 mx-4 font-label-sm text-label-sm text-[#EFE4AE]/50">
                    OR
                  </span>
                  <div className="flex-grow border-t border-[#EFE4AE]/20"></div>
                </div>
                <button
                  className="w-full bg-transparent border border-[#EFE4AE]/40 text-[#EFE4AE] font-label-md text-label-md py-4 px-6 rounded-full hover:bg-[#EFE4AE]/5 transition-colors flex justify-center items-center gap-3 glow-active"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                  Continue with Google
                </button>
              </div>
            </form>
          </div>

          <div className="mt-lg text-center flex flex-col items-center gap-3">
            <p className="font-body-md text-body-md text-[#EFE4AE]/70">
              Don&apos;t have an account?{' '}
              <Link
                className="text-[#EFE4AE] font-semibold hover:underline underline-offset-4 decoration-[#EFE4AE]/50 transition-all"
                to="/signup"
              >
                Sign up
              </Link>
            </p>
            <button
              className="font-label-sm text-label-sm text-[#EFE4AE]/60 hover:text-[#EFE4AE] transition-colors underline underline-offset-4 decoration-[#EFE4AE]/40"
              type="button"
              onClick={() => setGuestOpen(true)}
              disabled={loading}
            >
              Continue as Guest — no signup needed
            </button>
          </div>
        </div>
      </main>

      {guestOpen && (
        <GuestNameModal onSuccess={handleGuestSuccess} onClose={() => setGuestOpen(false)} />
      )}
    </div>
  )
}

export default Login
