// src/layouts/AppLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  Home,
  Bookmark,
  Users,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  Menu as MenuIcon,
  X as XIcon,
  LogOut as LogOutIcon
} from 'lucide-react';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useAuth } from '../features/auth/hooks/useAuth';
import Avatar from '../components/Avatar';

/**
 * Application shell that renders the sidebar, top bar (on mobile),
 * and the page content. It also manages the mobile drawer state and
 * handles logout and profile quick access.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useProfile();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // close drawer on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        mobileOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [mobileOpen]);

  // lock scroll when drawer open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  if (['/login', '/register'].includes(location.pathname)) {
    return <>{children}</>;
  }

  if (['/login', '/register'].includes(location.pathname)) {
    return <>{children}</>;
  }

  const sidebarItems = [
    { path: '/explore', label: 'Explore', icon: TrendingUp },
    { path: '/feed', label: 'Feed', icon: Home },
    { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { path: '/my-clubs', label: 'My Clubs', icon: Users },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/support', label: 'Support & Feedback', icon: HelpCircle },
    ...(user && (user.role === 'admin' || user.role === 'moderator')
      ? [{ path: '/admin', label: 'Admin', icon: Shield }]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-white shadow-sm border-r border-gray-200 flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold">CampusConnect</h1>
          <p className="text-sm text-gray-600">University Clubs Platform</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium transition ${
                  isActive(item.path)
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {user && (
          <>
            <div
              className="p-4 border-t border-gray-200 cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <div className="flex items-center gap-3">
                <Avatar avatar={user.avatar} size={32} />
                <div className="truncate">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">Student</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium text-red-600 hover:bg-red-50"
              >
                <LogOutIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main area: mobile topbar + content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <MenuIcon className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold">CampusConnect</h1>
              <p className="text-xs text-gray-500">Clubs Platform</p>
            </div>
          </div>
          {user && (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <Avatar avatar={user.avatar} size={32} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/25"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div
            ref={drawerRef}
            className="relative w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col overflow-y-auto"
          >
            <div className="p-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">CampusConnect</h1>
                <p className="text-xs text-gray-500">University Clubs</p>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <nav className="px-4 space-y-2 flex-1">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium transition ${
                      isActive(item.path)
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            {user && (
              <>
                <div
                  className="p-4 border-t border-gray-200 cursor-pointer"
                  onClick={() => {
                    navigate('/profile');
                    setMobileOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar avatar={user.avatar} size={32} />
                    <div className="truncate">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">Student</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      await handleLogout();
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOutIcon className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
