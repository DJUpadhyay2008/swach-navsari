import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { ReportIssuePage } from '@/pages/ReportIssuePage';
import { MyReportsPage } from '@/pages/MyReportsPage';
import { ReportDetailPage } from '@/pages/ReportDetailPage';
import { TrackComplaintPage } from '@/pages/TrackComplaintPage';
import { AuthPage } from '@/pages/AuthPage';
import { MunicipalAdminPage } from '@/pages/MunicipalAdminPage';
import { WorkerPortalPage } from '@/pages/WorkerPortalPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'report',
        element: <ReportIssuePage />,
      },
      {
        path: 'my-reports',
        element: <MyReportsPage />,
      },
      {
        path: 'reports/:id',
        element: <ReportDetailPage />,
      },
      {
        path: 'track',
        element: <TrackComplaintPage />,
      },
      {
        path: 'admin',
        element: <MunicipalAdminPage />,
      },
      {
        path: 'worker',
        element: <WorkerPortalPage />,
      },
      {
        path: 'community',
        element: <CommunityPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
