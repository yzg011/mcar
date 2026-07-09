import type { ReactNode } from 'react';
import HomePage from './pages/HomePage';
import NotifyPage from './pages/NotifyPage';
import OwnerPage from './pages/OwnerPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <HomePage />,
    public: true,
  },
  {
    name: '呼叫车主挪车（被堵方）',
    path: '/notify/:barkCode',
    element: <NotifyPage />,
    public: true,
  },
  {
    name: '车主确认挪车',
    path: '/owner/:barkCode',
    element: <OwnerPage />,
    public: true,
  },
];
