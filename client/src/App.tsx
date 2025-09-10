import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PageLoading } from './components/ui/Loading';
import ErrorBoundary from './components/ErrorBoundary';

// 页面组件
import Login from './pages/Login';
import { Register } from './pages/Register';
import Discover from './pages/Discover';
import { Profile } from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import Chat from './pages/Chat';

// 布局组件
import { Layout } from './components/Layout';

// 简单保护路由：仅校验登录，不做资料完整性跳转
const SimpleProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading text="正在验证身份..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// 公开路由：已登录用户不可访问
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoading text="正在验证身份..." />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 公开路由 */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* 受保护路由 */}
          <Route
            path="/"
            element={
              <SimpleProtected>
                <Layout>
                  <Discover />
                </Layout>
              </SimpleProtected>
            }
          />

          <Route
            path="/discover"
            element={
              <SimpleProtected>
                <Layout>
                  <Discover />
                </Layout>
              </SimpleProtected>
            }
          />

          <Route
            path="/chat"
            element={
              <SimpleProtected>
                <Layout>
                  <Chat />
                </Layout>
              </SimpleProtected>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <SimpleProtected>
                <Layout>
                  <Chat />
                </Layout>
              </SimpleProtected>
            }
          />

          {/* 个人资料页 */}
          <Route
            path="/profile"
            element={
              <SimpleProtected>
                <Layout>
                  <Profile />
                </Layout>
              </SimpleProtected>
            }
          />

          {/* 新增：资料设置页 */}
          <Route
            path="/setup"
            element={
              <SimpleProtected>
                <Layout>
                  <ProfileSetup />
                </Layout>
              </SimpleProtected>
            }
          />

          {/* 404 重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* 全局通知 */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              style: { background: '#10b981' },
            },
            error: {
              style: { background: '#ef4444' },
            },
          }}
        />
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;