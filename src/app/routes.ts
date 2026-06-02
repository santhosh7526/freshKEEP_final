import { createBrowserRouter } from 'react-router';
import Root from './pages/Root';
import Scanner from './pages/Scanner';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Settings from './pages/Settings';
import ShoppingList from './pages/ShoppingList';
import WasteLog from './pages/WasteLog';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
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
