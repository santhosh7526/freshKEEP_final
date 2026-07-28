import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Leaf, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { checkAndNotifyExpiringItems } from '../../backend/services/notifications';
import { useAuth } from '../context/AuthContext';

export default function Root() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Check expiring items on initial app load and trigger notifications
  useEffect(() => {
    checkAndNotifyExpiringItems();
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('Signed out of Google Account');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-center" richColors />

      {/* Top Header Bar with Google User Info */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-40 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#86A789] to-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm tracking-tight">FreshKeep</span>
              <span className="block text-[9px] uppercase tracking-wider text-[#86A789] font-bold">
                Smart Tracker
              </span>
            </div>
          </div>

          {/* Authenticated Google User Profile Pill */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 py-1 px-2 rounded-full bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/60 transition-all text-left"
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-white shadow-xs"
                />
                <span className="text-xs font-semibold text-gray-800 max-w-[90px] truncate">
                  {user.givenName}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-emerald-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Google Account Verified</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full mt-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out of Google
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1" onClick={() => setShowProfileMenu(false)}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
