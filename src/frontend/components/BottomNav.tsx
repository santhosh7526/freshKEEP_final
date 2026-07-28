import { Link, useLocation } from 'react-router-dom';
import { ScanLine, LayoutDashboard, ListChecks, Settings } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: ScanLine, label: 'Scan' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pantry', icon: ListChecks, label: 'Pantry' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-[#86A789]' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-xs mt-1 transition-colors ${
                  isActive ? 'text-[#86A789]' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
