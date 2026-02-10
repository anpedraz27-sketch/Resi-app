import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, Users, Settings, LogOut, Bell, Building } from 'lucide-react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'amenities', label: 'Amenities', icon: Building },
    { id: 'residents', label: 'Residents', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const residentTabs = [
    { id: 'dashboard', label: 'Reserve', icon: Home },
    { id: 'my-bookings', label: 'My Bookings', icon: Calendar },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ];

  const tabs = isAdmin ? adminTabs : residentTabs;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-sky-500/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl fixed inset-y-0 z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white">
              <Building size={18} />
            </div>
            ResiApp
          </h1>
          <p className="text-xs text-slate-500 mt-1 pl-10 capitalize">{user?.role} Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-medium text-white">{user?.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 z-50 safe-area-bottom">
        <div className="flex justify-around items-center p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px] ${
                activeTab === tab.id ? 'text-sky-400' : 'text-slate-500'
              }`}
            >
              <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
          <button
            onClick={logout}
             className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px] text-slate-500"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-medium">Exit</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
