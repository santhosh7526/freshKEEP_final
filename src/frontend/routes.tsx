import { createHashRouter, Navigate, useRouteError } from 'react-router-dom';
import Root from './pages/Root';
import Scanner from './pages/Scanner';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Settings from './pages/Settings';
import ShoppingList from './pages/ShoppingList';
import WasteLog from './pages/WasteLog';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Root />;
}

function PublicLoginLayout() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

function RootErrorBoundary() {
  const error: any = useRouteError();
  console.error('Application Route Error:', error);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4 font-bold text-2xl">
        ⚠️
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-xs text-gray-600 max-w-xs mb-6">
        {error?.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 bg-[#86A789] text-white rounded-xl font-bold shadow-md hover:bg-[#729275] transition-all text-xs"
      >
        Reload FreshKeep
      </button>
    </div>
  );
}

export const router = createHashRouter([
  {
    path: '/login',
    Component: PublicLoginLayout,
    ErrorBoundary: RootErrorBoundary,
  },
  {
    path: '/',
    Component: ProtectedLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: Scanner },
      { path: 'dashboard', Component: Dashboard },
      { path: 'pantry', Component: Pantry },
      { path: 'settings', Component: Settings },
      { path: 'shopping-list', Component: ShoppingList },
      { path: 'waste-log', Component: WasteLog },
    ],
  },
]);
