import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import TransactionDetail from './pages/TransactionDetail'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import History from './pages/History'
import Pay from './pages/Pay'
import Admin from './pages/Admin'
import UserShell from './components/UserShell'
import FreezeConfirm from './components/FreezeConfirm'
import ToastContainer from './components/ToastContainer'

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useApp()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  const { isAuthenticated, user } = useApp()

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />
              : <Login />
          }
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />}
        />

        {/* User shell: dashboard stays under overlays */}
        <Route element={<UserShell />}>
          <Route path="/dashboard" element={null} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/pay" element={<Pay />} />
          <Route path="/transaction/:id" element={<TransactionDetail />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
              <ToastContainer />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
