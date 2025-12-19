import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useOpsAuth } from '../hooks/useOpsAuth';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
  Bell,
  Menu,
  X,
} from 'lucide-react';

const OpsLayout = () => {
  const { user, logout } = useOpsAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/ops/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { path: '/ops/tenants', label: 'Tenants', icon: Building2 },
    { path: '/ops/support', label: 'Suporte', icon: Bell },
    { path: '/ops/users', label: 'Usuários Ops', icon: Users },
    { path: '/ops/settings', label: 'Configurações', icon: Settings },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-[100dvh] bg-gray-900 text-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-[100dvh] md:h-auto z-30 w-64 bg-gray-800 border-r border-gray-700 
          transform transition-transform duration-200 ease-in-out md:transform-none flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              TimelyOne Ops
            </span>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium">
                {user?.email?.[0]?.toUpperCase() ||
                  user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.username || user?.email}
              </p>
              <p className="text-xs text-gray-400 truncate capitalize">
                {user?.ops_role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-gray-700 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full md:w-auto overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 text-gray-400 hover:text-white md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-white truncate">
              {navItems.find((i) => location.pathname.startsWith(i.path))
                ?.label || 'Console'}
            </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OpsLayout;
