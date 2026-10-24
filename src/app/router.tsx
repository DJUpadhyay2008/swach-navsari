import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { ReportIssuePage } from '@/pages/ReportIssuePage';
import { TrackComplaintPage } from '@/pages/TrackComplaintPage';
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
        path: 'report',
        element: <ReportIssuePage />,
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
