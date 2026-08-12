import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/auth'

const INPUT_CLASS =
  'w-full bg-transparent border border-[#EFE4AE]/30 rounded-lg px-md py-sm font-body-md text-[#EFE4AE] placeholder-[#EFE4AE]/40 focus:border-[#EFE4AE] focus:ring-1 focus:ring-[#EFE4AE]/50 transition-all shadow-[inset_0_0_0_0.5px_transparent] focus:shadow-[inset_0_0_0_0.5px_rgba(239,228,174,0.3)] outline-none'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const username = email.includes('@') ? email : email || `user_${Date.now()}`
      await register({ username, email, password, full_name: name })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md overflow-hidden relative"
      style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div
          className="absolute -top-20 -left-20 w-[600px] opacity-30 transform -rotate-12"
          style={{
            maskImage: 'linear-gradient(to top, transparent, black 20%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent, black 20%)',
          }}
        >
          <img alt="" className="w-full h-auto" src="/signup-left.png" />
        </div>
        <div
          className="absolute -bottom-20 -right-20 w-[600px] opacity-30 transform rotate-12"
          style={{
            maskImage: 'linear-gradient(to top, transparent, black 20%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent, black 20%)',
          }}
        >
          <img alt="" className="w-full h-auto" src="/signup-right.png" />
        </div>
      </div>

      <main className="w-full max-w-md relative z-10">
        <div className="text-center mb-xl">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-[#EFE4AE] mb-base tracking-tight leading-tight">
            Start Your Journey
          </h1>
          <p className="font-body-lg text-[#EFE4AE]/70 max-w-[280px] mx-auto text-center">
            Begin your 60-second check-in today.
          </p>
        </div>

        <div className="w-full bg-[#12281D] shadow-[0_8px_32px_rgba(18,40,29,0.4)] rounded-[24px] p-md md:p-lg border border-[#EFE4AE]/10 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="flex flex-col gap-xs">
              <label className="block font-label-md text-[#EFE4AE]" htmlFor="name">
                Full Name
              </label>
              <input
                className={INPUT_CLASS}
                id="name"
                name="name"
                placeholder="Emerson Thoreau"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="block font-label-md text-[#EFE4AE]" htmlFor="email">
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
              <label className="block font-label-md text-[#EFE4AE]" htmlFor="password">
                Password
              </label>
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
              <p className="font-label-md text-error text-center" role="alert">
                {error}
              </p>
            )}

            <button
              className="w-full bg-[#EFE4AE] text-[#12281D] font-label-md font-semibold rounded-full py-[16px] px-md mt-md flex justify-center items-center gap-base hover:opacity-90 transition-opacity disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
              {!loading && (
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              )}
            </button>

            <div className="flex items-center my-md">
              <div className="flex-grow border-t border-[#EFE4AE]/20"></div>
              <span className="px-sm font-label-sm text-[#EFE4AE]/50 uppercase tracking-widest text-xs">
                OR
              </span>
              <div className="flex-grow border-t border-[#EFE4AE]/20"></div>
            </div>

            <button
              className="w-full bg-transparent border border-[#EFE4AE]/40 text-[#EFE4AE] font-label-md rounded-full py-[14px] px-md flex justify-center items-center gap-sm hover:bg-[#EFE4AE]/5 transition-colors duration-300"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              Sign up with Google
            </button>
          </form>
        </div>

        <div className="mt-lg text-center">
          <p className="font-body-md text-[#EFE4AE]/70">
            Already have an account?{' '}
            <Link
              className="text-[#EFE4AE] hover:text-white transition-colors duration-200 underline decoration-[#EFE4AE]/50 underline-offset-4 hover:decoration-[#EFE4AE]"
              to="/login"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Signup
