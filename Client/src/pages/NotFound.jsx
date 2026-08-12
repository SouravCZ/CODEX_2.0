import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div
      className="bg-primary-container text-on-surface min-h-screen flex flex-col font-body-md text-body-md overflow-x-hidden relative"
      style={{ backgroundColor: '#12281D', color: '#e2e3e0' }}
    >
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-between overflow-hidden">
        <div className="w-1/3 max-w-md h-full relative opacity-30" style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}>
          <img
            alt=""
            className="absolute -left-1/4 top-0 w-[150%] h-[120%] object-cover object-top opacity-50 mix-blend-screen"
            src="/checkin-left.png"
          />
        </div>
        <div className="w-1/3 max-w-md h-full relative opacity-30" style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}>
          <img
            alt=""
            className="absolute -right-1/4 top-0 w-[150%] h-[120%] object-cover object-top opacity-50 mix-blend-screen"
            src="/checkin-right.png"
          />
        </div>
      </div>

      <main className="flex-grow flex items-center justify-center relative z-10 px-gutter py-xl">
        <div className="max-w-2xl w-full flex flex-col items-center text-center">
          <h1 className="font-serif text-[120px] md:text-[180px] leading-none text-[#EFE4AE] drop-shadow-md mb-sm">
            404
          </h1>
          <p className="font-body-lg text-[#EFE4AE] mb-lg max-w-md">
            Even a detour is part of the journey. Let&apos;s find your center again.
          </p>

          <div className="bg-surface/10 backdrop-blur-xl border border-[#EFE4AE]/20 rounded-[24px] p-md md:p-lg shadow-[0_8px_32px_rgba(18,40,29,0.4)] flex flex-col gap-md w-full max-w-sm">
            <Link
              className="group w-full flex items-center justify-center bg-secondary text-on-secondary px-xl py-4 rounded-full font-label-md transition-all duration-300 hover:shadow-[inset_0_0_8px_rgba(255,255,255,0.4)] hover:bg-[#F2EAC0]"
              to="/"
            >
              Back to Home
              <span className="material-symbols-outlined ml-2 text-[18px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>
            <Link
              className="group w-full flex items-center justify-center bg-transparent border border-outline-variant text-on-surface px-xl py-4 rounded-full font-label-md transition-all duration-300 hover:border-secondary hover:text-secondary hover:bg-surface-container/50"
              to="/dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container-lowest w-full py-xl z-10 relative">
        <div className="flex flex-col items-center gap-4 max-w-[1280px] mx-auto text-center px-gutter">
          <div className="font-serif text-headline-md text-on-surface mb-md">Drift Journal</div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-md font-label-sm uppercase tracking-wider text-on-surface-variant">
            <a className="hover:text-primary transition-colors duration-200" href="/privacy">
              Privacy Policy
            </a>
            <a className="hover:text-primary transition-colors duration-200" href="/terms">
              Terms of Service
            </a>
            <span className="w-full mt-2 text-outline text-center">
              Medical Disclaimer: Drift is a self-reflection tool, not a substitute for
              professional mental health care.
            </span>
          </nav>
          <div className="font-label-sm text-on-surface-variant mt-sm border-t border-surface-container-high pt-sm w-full max-w-md">
            © {new Date().getFullYear()} Drift Journal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default NotFound
