import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { checkAndNotifyExpiringItems } from '../lib/notifications';

export default function Root() {
  // Check expiring items on initial app load and trigger notifications
  useEffect(() => {
    checkAndNotifyExpiringItems();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" richColors />
      <Outlet />
      <BottomNav />
    </div>
  );
}
