import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ReportBreakdown from './ReportBreakdown'
import AppNav from '../components/AppNav'
import { getReport, getReportMeta } from '../services/emotionService'
import { logout } from '../services/auth'

function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const report = getReport(id)
  const meta = getReportMeta(id)

  if (!report) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div style={{ backgroundColor: '#12281d' }}>
      <AppNav
        active="report"
        onLogout={() => {
          logout()
          navigate('/')
        }}
      />
      <ReportBreakdown
        report={report}
        checkinId={id}
        savedAt={meta?.saved_at || null}
        onStartCheckIn={() => navigate('/checkin')}
        onDashboard={() => navigate('/dashboard')}
        onBreathing={() => navigate('/checkin?mode=breathing')}
        onReflect={() => navigate('/journal')}
      />
    </div>
  )
}

export default Report
