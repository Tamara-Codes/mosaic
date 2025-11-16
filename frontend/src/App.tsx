import { AdminDashboard } from './components/AdminDashboard'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <ProtectedRoute>
      <AdminDashboard onViewChange={() => {}} />
    </ProtectedRoute>
  )
}

export default App
