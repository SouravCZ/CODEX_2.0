function CheckInProof({ result, onViewReport, onDashboard }) {
  if (result?.error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-body-md text-body-md"
        style={{ backgroundColor: '#121413', color: '#e2e3e0' }}
      >
        <main className="relative z-10 w-full max-w-md px-margin-mobile md:px-0 mx-auto flex flex-col gap-lg items-center text-center">
          <h1 className="font-serif text-display-lg-mobile md:text-display-lg text-[#eee3ad]">
            Re-check unavailable
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">{result.error}</p>
          <button
            className="w-full bg-[#eee3ad] text-on-secondary-fixed font-label-md text-label-md py-4 px-6 rounded-full hover:bg-secondary transition-colors duration-300"
            type="button"
            onClick={onDashboard}
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    )
  }

  const hrvBefore =
    result && typeof result?.before?.hrv_rmssd_ms === 'number'
      ? Math.round(result.before.hrv_rmssd_ms)
      : result && typeof result.hrv_before === 'number'
        ? Math.round(result.hrv_before)
        : null
  const hrvAfter =
    result && typeof result?.after?.hrv_rmssd_ms === 'number'
      ? Math.round(result.after.hrv_rmssd_ms)
      : result && typeof result.hrv_after === 'number'
        ? Math.round(result.hrv_after)
        : null
  const improved = Math.round(
    result && typeof result.improvement_pct === 'number'
      ? result.improvement_pct
      : hrvBefore > 0
        ? ((hrvAfter - hrvBefore) / hrvBefore) * 100
        : 0
  )

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-body-md text-body-md"
      style={{ backgroundColor: '#121413', color: '#e2e3e0' }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen"
        style={{
          backgroundImage: 'url("/proof-fern.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#121413]/40 via-[#121413]/80 to-[#121413] z-0"></div>

      <main className="relative z-10 w-full max-w-lg px-margin-mobile md:px-0 mx-auto flex flex-col gap-lg items-center">
        <header className="text-center space-y-sm">
          <h1 className="font-serif text-display-lg-mobile md:text-display-lg text-[#eee3ad]">
            Restored Balance
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm mx-auto">
            Your breathing session had a measurable, positive impact on your nervous system.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-md w-full">
          <div className="glass-card rounded-[24px] p-6 flex flex-col items-center justify-center gap-xs shadow-[0_8px_32px_rgba(18,40,29,0.3)]">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              HRV Before
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-[48px] leading-none text-on-surface/60 tabular-nums">
                {hrvBefore ?? '—'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">ms</span>
            </div>
          </div>

          <div className="glass-card rounded-[24px] p-6 flex flex-col items-center justify-center gap-xs relative overflow-hidden shadow-[0_8px_32px_rgba(18,40,29,0.3)] border-t-[#eee3ad]/30 border-l-[#eee3ad]/20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#eee3ad]/5 to-transparent pointer-events-none"></div>
            <span className="font-label-sm text-label-sm text-[#eee3ad] uppercase tracking-widest relative z-10">
              HRV After
            </span>
            <div className="flex items-baseline gap-1 relative z-10">
              <span className="font-serif text-[56px] leading-none text-[#eee3ad] drop-shadow-[0_0_12px_rgba(238,227,173,0.3)] tabular-nums">
                {hrvAfter ?? '—'}
              </span>
              <span className="font-label-sm text-label-sm text-[#eee3ad]/80">ms</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-sm bg-primary-container/30 px-6 py-4 rounded-full border border-primary-fixed/10 backdrop-blur-sm">
          <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
            trending_up
          </span>
          <p className="font-body-md text-body-md text-primary-fixed">
            Your HRV improved by <strong className="font-semibold text-[#eee3ad]">{improved}%</strong>
          </p>
        </div>

        <div className="w-full flex flex-col gap-sm mt-md">
          <button
            className="w-full bg-[#eee3ad] text-on-secondary-fixed font-label-md text-label-md py-4 px-6 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(18,40,29,0.4)] hover:bg-secondary transition-colors duration-300 flex items-center justify-center gap-2"
            type="button"
            onClick={onViewReport}
          >
            <span>View Full Report</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <button
            className="w-full bg-surface-container text-on-surface font-label-md text-label-md py-4 px-6 rounded-full hover:bg-surface-container-high transition-colors duration-300 border border-outline-variant/30"
            type="button"
            onClick={onDashboard}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}

export default CheckInProof
