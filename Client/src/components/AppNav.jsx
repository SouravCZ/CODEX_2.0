import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'journal', label: 'Journal' },
  { key: 'checkin', label: 'Start Check-In' },
]

function AppNav({ active, onLogout, transparent = false }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function go(key) {
    setMenuOpen(false)
    navigate(key === 'checkin' ? '/checkin' : `/${key}`)
  }

  return (
    <nav className="sticky top-0 z-50 px-margin-mobile md:px-margin-desktop pt-4 pb-2">
      <div
        className={
          transparent
            ? 'max-w-7xl mx-auto flex justify-between items-center w-full rounded-2xl md:rounded-full bg-transparent border border-[#efe4ae]/10 px-6 md:px-10 py-5'
            : 'max-w-7xl mx-auto flex justify-between items-center w-full rounded-2xl md:rounded-full bg-[#141c15]/55 backdrop-blur-xl border border-[#efe4ae]/15 px-6 md:px-10 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(239,228,174,0.08)]'
        }
      >
        <button
          className="font-serif font-bold italic text-3xl md:text-[32px] text-[#efe4ae] hover:opacity-80 transition-opacity"
          type="button"
          onClick={() => go('dashboard')}
        >
          Drift Journal
        </button>

        <div className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={
                item.key === active
                  ? 'text-[#efe4ae] bg-[#efe4ae]/15 rounded-full px-5 py-2.5 hover:opacity-90 transition-all duration-300'
                  : 'text-[#efe4ae]/70 hover:text-[#efe4ae] hover:bg-[#efe4ae]/10 rounded-full px-5 py-2.5 transition-all duration-300'
              }
              type="button"
              onClick={() => go(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            className="hidden md:block font-label-md text-[#efe4ae]/70 hover:text-[#efe4ae] transition-colors"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
          <button
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-variant transition-colors text-[#efe4ae] border border-[#efe4ae]/20"
            type="button"
            onClick={onLogout}
            aria-label="Account"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>

          <button
            className="md:hidden w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-variant transition-colors text-[#efe4ae] border border-[#efe4ae]/20"
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden max-w-7xl mx-auto mt-2 overflow-hidden rounded-2xl bg-[#141c15]/95 backdrop-blur-xl border border-[#efe4ae]/15 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="flex flex-col p-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  className={`text-left px-4 py-3 rounded-xl font-label-md transition-colors ${
                    item.key === active
                      ? 'text-[#efe4ae] bg-[#efe4ae]/15'
                      : 'text-[#efe4ae]/70 hover:text-[#efe4ae] hover:bg-[#efe4ae]/10'
                  }`}
                  type="button"
                  onClick={() => go(item.key)}
                >
                  {item.label}
                </button>
              ))}
              <button
                className="text-left px-4 py-3 rounded-xl font-label-md text-[#efe4ae]/70 hover:text-[#efe4ae] hover:bg-[#efe4ae]/10 transition-colors"
                type="button"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default AppNav