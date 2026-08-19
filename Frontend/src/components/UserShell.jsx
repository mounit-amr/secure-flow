import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Dashboard from '../pages/Dashboard'
import FreezeConfirm from './FreezeConfirm'
import ToastContainer from './ToastContainer'

/** Keeps dashboard mounted so overlay pages can blur it in the background */
export default function UserShell() {
  const { user, isAuthenticated } = useApp()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  const isOverlay = location.pathname !== '/dashboard'

  return (
    <>
      <div
        className="dashboard-underlay"
        style={isOverlay ? { pointerEvents: 'none', userSelect: 'none' } : undefined}
        aria-hidden={isOverlay}
      >
        <Dashboard />
      </div>
      <Outlet />
      <FreezeConfirm />
      <ToastContainer />
    </>
  )
}
