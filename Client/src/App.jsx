import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/PageTransition'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Report from './pages/Report'
import Journal from './pages/Journal'
import NotFound from './pages/NotFound'
import { isAuthenticated, getUser } from './services/api'
import { logout } from './services/auth'

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function RedirectIfAuthed({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children
}

function DashboardRoute() {
  const navigate = useNavigate()
  return (
    <Dashboard
      userName={getUser()?.full_name || 'Ankan'}
      onStartCheckIn={() => navigate('/checkin')}
      onBreathing={() => navigate('/checkin?mode=breathing')}
      onLogout={() => {
        logout()
        navigate('/')
      }}
      onNavigate={(key) => navigate(key === 'checkin' ? '/checkin' : `/${key}`)}
      onOpenReport={(id) => navigate(`/report/${id}`)}
    />
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <AnimatePresence>
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/signup"
            element={
              <RedirectIfAuthed>
                <Signup />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/checkin"
            element={
              <RequireAuth>
                <CheckIn />
              </RequireAuth>
            }
          />
          <Route
            path="/report/:id"
            element={
              <RequireAuth>
                <Report />
              </RequireAuth>
            }
          />
          <Route
            path="/journal"
            element={
              <RequireAuth>
                <Journal />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
