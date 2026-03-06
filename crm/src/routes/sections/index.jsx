import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router';

import { SplashScreen } from 'src/components/loading-screen';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { authDemoRoutes } from './auth-demo';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';

// ----------------------------------------------------------------------

const Page404 = lazy(() => import('src/pages/error/404'));

export const routesSection = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },

  // Auth
  ...authRoutes,
  ...authDemoRoutes,

  // Dashboard
  ...dashboardRoutes,

  // Main
  ...mainRoutes,

  // Components
  ...componentsRoutes,

  // No match
  { path: '*', element: <Page404 /> },
];
