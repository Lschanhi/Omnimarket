import { createFileRoute } from '@tanstack/react-router'
import { getStoredUser } from '../Services/auth/session'
import { AdminDashboardPage } from '../pages/User/AdminDashboardPage'
import { PerfilUsuarioPage } from '../pages/User/ProfileUserPage'

export const Route = createFileRoute('/perfilUsuario')({
  component: RouteComponent,
})

function RouteComponent() {
  return getStoredUser()?.role === "Admin" ? <AdminDashboardPage /> : <PerfilUsuarioPage />
}
