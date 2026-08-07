const HERO_GRADIENT =
  'linear-gradient(rgba(18, 40, 29, 0.93), rgba(18, 40, 29, 0.93)), url("/bg-hero.png")'
const CREAM_GRADIENT =
  'linear-gradient(rgba(238, 227, 173, 0.94), rgba(238, 227, 173, 0.94)), url("/bg-how.png")'

function Landing() {
  return (
    <div className="bg-primary-container text-on-surface font-body-md antialiased overflow-x-hidden selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <style>{`
        .orbit-slow { animation: drift-spin 10s linear infinite; }
        .orbit-slow-reverse { animation: drift-spin 8s linear infinite reverse; }
        @keyframes drift-spin { to { transform: rotate(360deg); } }
      `}</style>

      <nav className="fixed top-0 w-full z-50 bg-primary-container/80 nav-blur border-b border-on-surface/10 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center px-gutter py-4 max-w-container-max mx-auto">
          <a
            className="font-display-lg text-headline-md tracking-tighter text-on-surface hover:opacity-80 transition-opacity"
            href="/"
          >
            Drift Journal
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#features"
            >
              Features
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#how-it-works"
            >
              How It Works
            </a>
          </div>
          <a
            className="arrow-btn inline-flex items-center justify-center bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md px-6 py-3 rounded hover:opacity-90 transition-opacity uppercase tracking-widest"
            href="/signup"
          >
            Get Started{' '}
            <span className="arrow-icon ml-2 inline-block material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </a>
        </div>
      </nav>

      <section
        className="min-h-screen flex flex-col justify-center items-center text-center px-gutter pt-32 pb-section-padding bg-primary-container text-secondary-fixed relative overflow-hidden"
        style={{
          backgroundImage: HERO_GRADIENT,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        }}
      >
        <div className="max-w-4xl mx-auto relative z-10 space-y-8">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-secondary-fixed tracking-tight leading-tight">
            Catch burnout before your journal does.
          </h1>
          <p className="font-body-lg text-body-lg text-secondary-fixed-dim max-w-2xl mx-auto leading-relaxed">
            A 60-second check-in fuses your face, voice, heartbeat and words into one Emotional
            X-Ray.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <a
              className="arrow-btn w-full sm:w-auto inline-flex items-center justify-center bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md px-8 py-4 rounded hover:opacity-90 transition-opacity uppercase tracking-widest"
              href="/checkin"
            >
              Start a Free Check-In{' '}
              <span className="arrow-icon ml-2 inline-block material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </a>
            <a
              className="arrow-btn w-full sm:w-auto inline-flex items-center justify-center border border-secondary-fixed text-secondary-fixed font-label-md text-label-md px-8 py-4 rounded hover:bg-secondary-fixed/5 transition-colors uppercase tracking-widest"
              href="/login"
            >
              Continue as Guest{' '}
              <span className="arrow-icon ml-2 inline-block material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </a>
          </div>
          <p className="font-body-md text-sm text-secondary-fixed/60 pt-4">
            Not a medical tool — for reflection.
          </p>
        </div>
      </section>

      <section
        className="py-section-padding px-gutter bg-secondary-fixed text-on-secondary-fixed"
        id="how-it-works"
        style={{
          backgroundImage: CREAM_GRADIENT,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="max-w-container-max mx-auto">
          <h2 className="font-display-lg text-headline-md md:text-display-lg text-center mb-16 tracking-tight">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-8 border border-on-secondary-fixed/20 rounded backdrop-blur-md bg-on-secondary-fixed/10">
              <div className="w-16 h-16 rounded-full bg-on-secondary-fixed/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>
              <h3 className="font-headline-md text-label-md mb-4 uppercase tracking-widest">
                Check In
              </h3>
              <p className="font-body-md text-body-md text-on-secondary-fixed/80">
                60s webcam + mic
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 border border-on-secondary-fixed/20 rounded backdrop-blur-md bg-on-secondary-fixed/10">
              <div className="w-16 h-16 rounded-full bg-on-secondary-fixed/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">monitor_heart</span>
              </div>
              <h3 className="font-headline-md text-label-md mb-4 uppercase tracking-widest">
                X-Ray
              </h3>
              <p className="font-body-md text-body-md text-on-secondary-fixed/80">
                4 signals read &amp; fused
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 border border-on-secondary-fixed/20 rounded backdrop-blur-md bg-on-secondary-fixed/10">
              <div className="w-16 h-16 rounded-full bg-on-secondary-fixed/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">self_improvement</span>
              </div>
              <h3 className="font-headline-md text-label-md mb-4 uppercase tracking-widest">
                Prove It
              </h3>
              <p className="font-body-md text-body-md text-on-secondary-fixed/80">
                Guided breathing, HRV improves on screen
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-section-padding px-gutter bg-primary-container text-secondary-fixed border-t border-secondary-fixed/10"
        style={{
          backgroundImage: HERO_GRADIENT,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        }}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="font-body-lg text-headline-md md:text-headline-md leading-relaxed tracking-tight">
              Most apps ask how you feel. We also check your face, voice and heartbeat — so we
              catch the stress you&apos;re hiding.
            </p>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-64 h-64 border border-secondary-fixed/20 rounded-full flex items-center justify-center">
              <div className="absolute w-48 h-48 border border-secondary-fixed/40 rounded-full orbit-slow"></div>
              <div className="absolute w-32 h-32 border border-secondary-fixed/60 rounded-full orbit-slow-reverse"></div>
              <span className="material-symbols-outlined text-4xl text-secondary-fixed">
                psychology
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-section-padding px-gutter bg-secondary-fixed text-on-secondary-fixed text-center"
        style={{
          backgroundImage: CREAM_GRADIENT,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg tracking-tight">
            See what your body already knows.
          </h2>
          <a
            className="arrow-btn inline-flex items-center justify-center bg-on-secondary-fixed text-secondary-fixed font-label-md text-label-md px-8 py-4 rounded hover:opacity-90 transition-opacity uppercase tracking-widest"
            href="/checkin"
          >
            Start Free Check-In{' '}
            <span className="arrow-icon ml-2 inline-block material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </a>
          <p className="font-body-md text-sm text-on-secondary-fixed/60">
            No signup needed for the demo.
          </p>
        </div>
      </section>

      <footer className="bg-surface-container-lowest text-on-surface-variant py-section-padding px-gutter">
        <div className="max-w-container-max mx-auto flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="font-display-lg text-headline-md text-on-surface tracking-tighter">
              Drift Journal
            </span>
            <span className="font-body-md text-sm text-on-surface-variant">Catch burnout early</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <a className="font-label-md text-label-md hover:text-primary transition-colors duration-200" href="#">
              Privacy Policy
            </a>
            <a className="font-label-md text-label-md hover:text-primary transition-colors duration-200" href="#">
              Terms of Service
            </a>
          </div>
          <div className="max-w-2xl text-center">
            <p className="font-label-md text-label-md text-on-surface-variant/60 leading-relaxed uppercase">
              Medical Disclaimer: Drift is a self-reflection tool, not a substitute for professional
              mental health care. Not a medical diagnosis tool.
            </p>
          </div>
          <p className="font-label-md text-label-md mt-8 text-on-surface-variant/40">
            © 2024 Drift Journal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
