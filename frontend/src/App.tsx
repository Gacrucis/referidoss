import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { LeadersPage } from './pages/LeadersPage';
import { TreePage } from './pages/TreePage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicRegisterPage } from './pages/PublicRegisterPage';
import { PublicSubleaderRegisterPage } from './pages/PublicSubleaderRegisterPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdnLineasPage } from './pages/AdnLineasPage';
import { AdnOksPage } from './pages/AdnOksPage';
import { LeaderPapasPage } from './pages/LeaderPapasPage';
import { LeaderPanelPage } from './pages/LeaderPanelPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro/:code" element={<PublicRegisterPage />} />
          <Route path="/register/:code" element={<PublicRegisterPage />} />
          <Route path="/registro-lider/:code" element={<PublicSubleaderRegisterPage />} />

          {/* Rutas protegidas con Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tree"
            element={
              <ProtectedRoute>
                <Layout>
                  <TreePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaders"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Layout>
                  <LeadersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/adn/lineas"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Layout>
                  <AdnLineasPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/adn/oks"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Layout>
                  <AdnOksPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leader-papas"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Layout>
                  <LeaderPapasPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Panel de Líder Jerárquico */}
          <Route
            path="/leader/panel"
            element={
              <ProtectedRoute allowedRoles={['leader_papa', 'leader_hijo', 'leader_lnpro']}>
                <Layout>
                  <LeaderPanelPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'leader']}>
                <Layout>
                  <AdminUsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
