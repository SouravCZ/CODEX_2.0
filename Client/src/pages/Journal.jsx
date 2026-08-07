import { useNavigate } from 'react-router-dom'
import JournalEditor from '../components/JournalEditor'
import AppNav from '../components/AppNav'
import { logout } from '../services/auth'

function Journal() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#12281D', color: '#EFE4AE' }}>
      <AppNav
        active="journal"
        onLogout={() => {
          logout()
          navigate('/')
        }}
      />

      <main className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg z-10 relative">
        <header className="mb-lg">
          <h1 className="font-serif text-5xl md:text-display-lg text-[#EFE4AE] tracking-tight">Journal</h1>
          <p className="font-body-md text-[#EFE4AE]/70 mt-2">
            Reflect on your reflections. Private, secure, always yours.
          </p>
        </header>
        <JournalEditor />
      </main>
    </div>
  )
}

export default Journal
