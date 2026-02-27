import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUpPage from './pages/SignUpPage';
import AdminDashboard from './pages/AdminDashboard';
import ResidentDashboard from './pages/ResidentDashboard';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  React.useEffect(() => {
    if (user) {
      setAuthView('login');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (authView === 'signup') {
      return <SignUpPage onNavigate={setAuthView} />;
    }
    return <Login onNavigate={setAuthView} />;
  }

  return (
    <Layout activeTab={currentTab} onTabChange={setCurrentTab}>
      {user.role === 'admin' ? (
        <AdminDashboard activeSubTab={currentTab} />
      ) : (
        <ResidentDashboard activeSubTab={currentTab} />
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
