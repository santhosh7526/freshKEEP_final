import { Outlet } from 'react-router';
import { BottomNav } from '../components/BottomNav';

export default function Root() {
  return (
    <div className="min-h-screen bg-white">
      <Outlet />
      <BottomNav />
    </div>
  );
}
